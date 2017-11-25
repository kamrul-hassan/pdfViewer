//==============================================================================
// app.js
// Purpose: Main application script
//------------------------------------------------------------------------------

var App = function(){
	var pub = this;
	var pri = {};
	pri.isRenderHtml = false;
	pri.selectedFormulary = '';
	pri.imageData = '';
	pri.formData = '';
	pub.currentPage = 1;
	pri.hasSignature = false;
	pri.isRegisterSignaturePad = false;
	pub.isSaveSuccessfully = false;
	pub.loadFormulary = function () {
		//Get data from database
		executeScript('formularyData',pri.renderFormulary);
		//pri.renderFormulary(JSON.stringify(Constant.formularyList));
	};
	pri.renderFormulary = function(data){		
		$('#formulary-table .table-row').remove();
		var div = $('#formulary-table');
		var html = '';
		$.each(data, function (index, value) {
			html += '<div class="table-row" data-value=' + value.NAME + '>' +
				'<div class="table-cell">' + value.NAME + '</div>' +
				'<div class="table-cell">' + value.VERSION_NUMBER + '</div>' +
				'<div class="table-cell">' + value.PUBLISH_DATE + '</div></div>';
		});
		div.append(html);
	}
	pub.previousPage = function () {
		$("#previous-view").removeClass('hide');
		if (pub.currentPage == 2) {
			pub.currentPage = 1;
			$('.page.hide').removeClass('hide');
			$('#fill-attributes-section').addClass('hide');
			$('#review-section').removeClass('hide').addClass('hide');
			$("#previous-view").removeClass('hide').addClass('hide');
			$('#validate-form').removeClass('hide').addClass('hide');
		}
		else if (pub.currentPage == 3) {
			pub.currentPage = 2;
			$('.page.hide').removeClass('hide');
			$('#select-formulary-section').addClass('hide');
			$('#review-section').addClass('hide');
			$("#next-view").removeClass('hide');
			$('#validate-form').removeClass('hide').addClass('hide');
		}
	}
	pub.nextPage = function () {
		if (pub.currentPage == 1) {
			pub.currentPage = 2;
			$('.page.hide').removeClass('hide');
			$('#select-formulary-section').removeClass('hide').addClass('hide');
			$('#review-section').addClass('hide');
			$("#previous-view").removeClass('hide');
			$('#validate-form').removeClass('hide').addClass('hide');
			if(!pri.isRenderHtml){
				pri.generateHtmlForm();				
			}
			pri.isRenderHtml = true;	
		}
		else if (pub.currentPage == 2) {
			var isValid = pri.validateAttributes();
			if(isValid){
				pub.currentPage = 3;
				$('.page.hide').removeClass('hide');
				$('#select-formulary-section').addClass('hide');
				$('#fill-attributes-section').addClass('hide');
				$("#previous-view").removeClass('hide');
				$('#validate-form').removeClass('hide');
				$("#next-view").removeClass('hide').addClass('hide');								
				pri.writeInPdf(false);
				if(!pri.isRegisterSignaturePad && pri.hasSignature){
					pri.isRegisterSignaturePad = true;
					pri.registerSignaturePad();	
				}							
			}
			else{
				$('#validation-modal').modal('show');
			}	
		}
	};	
	pub.save = function(){
		var isValid = pri.validate();
		if(isValid){
			var base64Data = pri.writeInPdf(true);	
			var saveData = {
				'base64Data': base64Data, 
				'customerName': $('#customerName').val(),
				'CIPCode': $('#CIPCode').val(),
				'emailPharmacist': $('#emailPharmacist').val(),
			}
			pub.isSaveSuccessfully = false;			
			executeScript('saveData',pri.saveConfirmation,saveData);
		}
		else{
			$('#validation-modal').modal('show');
		}			
	};
	pri.saveConfirmation = function(errorMsg){
		if(errorMsg){			
			$('#error-message-body').empty();
			$('#error-message-body').html('<p class="validation-summary-errors">There was an error on this page. <br/>Error description: '+ errorMsg + '</p>');
			$('#error-message-modal').modal('show');
		}
		else{
			pub.isSaveSuccessfully = true;
			$('#error-message-body').empty();
			$('#error-message-body').html('<p>Data saved successfully</p>');
			$('#error-message-modal').modal('show');			
		}
	};
	pri.validate = function(){
		var errorMsg = '';
		var isRepFailed = false; 
		$.each(pri.formData, function(index, item){
			if (item.PAGE_NUMBER == 0 && item.IS_MANDATORY && item.IS_VISIBLE) {				
				if(item.DATA_TYPE == 'E' && $('#'+item.FIELD_NAME).val() && !pri.validateEmail($('#'+item.FIELD_NAME).val())){
					errorMsg += '<li>Enter valid email address</li>';
					$('#'+item.FIELD_NAME).removeClass('is-invalid').addClass('is-invalid');
				}
				else if(item.DATA_TYPE == 'S' && pri.isCanvasBlank(document.getElementById(item.FIELD_NAME))){					
					if(!isRepFailed){
						errorMsg += '<li>'+item.FIELD_LABEL+' required</li>';
					}						
					isRepFailed	= true;			
				}
				else if(item.DATA_TYPE == 'B' && $('#'+item.FIELD_NAME).is(':checked')){
					errorMsg += '<li>'+item.FIELD_LABEL+' required</li>';
				}
				else if(!$('#'+item.FIELD_NAME).val() && item.DATA_TYPE != 'S'){
					errorMsg += '<li>'+item.FIELD_LABEL+' required</li>';
					$('#'+item.FIELD_NAME).removeClass('is-invalid').addClass('is-invalid');
				}
			}
		});
		if (errorMsg != "") {
			$('#validation-message').empty();
            $('#validation-message').html('<ul class="validation-summary-errors">'+ errorMsg + '</ul>');
            return false;
		}
		return true;
	}
	pub.previewSignature = function(){
		pri.writeInPdf(false);
	};
	pub.clearSignature = function(element){
		pri[element.id].clear();
	};
	pri.writeInPdf = function (isSave) {
		var doc = new jsPDF();
		doc.addImage(pri.imageData, 'JPEG', 0, 0, 210, 0);
		doc.setFontSize(9);
		$.each(pri.formData, function(index, item){
			if (item.PAGE_NUMBER == 1 && item.IS_VISIBLE) {
				doc.text(item.LEFT, item.TOP, $('#'+item.FIELD_NAME).val());
			}
			else if(pri.isRegisterSignaturePad && item.PAGE_NUMBER == 0 && item.IS_VISIBLE && item.DATA_TYPE == 'S'){
				var image = pri.cropSignatureCanvas(document.getElementById(item.FIELD_NAME));
				if(image)	{
					doc.addImage(image.data, 'PNG', item.LEFT, item.TOP, image.width, image.height);
				}	
			}
		});
		if(isSave){
			return	doc.output('datauristring');
		}		
		$("#pdf_preview").attr("src", doc.output('datauristring'));
		
	}

	pri.drawpdfInIframe = function (base64Data, iFrameId) {
		var doc = new jsPDF();
		pri.imageData = base64Data;
		doc.addImage(base64Data, 'JPEG', 0, 0, 210, 0);
		$(iFrameId).attr("src", doc.output('datauristring'));
	}
	pub.selectaFormulary = function (element, formulary) {
		$('.table-row').removeClass('active');
		$(element).addClass('active');
		pri.selectedFormulary = formulary;
		$('#next-view').removeAttr('disabled');	
		pri.isRenderHtml = false;	
		pri.isRegisterSignaturePad = false;
		pri.hasSignature = false;
		//get base64 data from database by selected formulary
		executeScript('documentHistory',pri.pdfPreview,{'FORMULARY': formulary});
		//pri.pdfPreview(Constant.formularyABase64Data);				
	};

	pri.pdfPreview = function(jsonData){
		//view base64 data 
		var data = jsonData[0].ATTACHMENT_CONTENT;		
		pri.drawpdfInIframe(data, "#viewFormulary");		
	}
	
	pri.addNewlines = function addNewlines(value, length) {
		var result = '';
		while (value.length > 0) {
			result += value.substring(0, length) + '\n';
			value = value.substring(200);
		}
		return result;
	};
	pri.generateHtmlForm = function () {
		$('#fill-attributes-form').empty();
		//get dynamic fields details from database depend on formulary selection
		//For now getting data from a variable
		executeScript('dynamicFieldsData',pri.renderAttributes,{'FORMULARY': pri.selectedFormulary });
		//pri.renderAttributes(JSON.stringify(Constant.formularyAFields));
	}
	pri.renderAttributes = function(data){
		var div = $('#fill-attributes-form');
		var html = '';		
		pri.formData = data;
		var filterData = [];
		$.each(data, function(index, item){
			if (item.PAGE_NUMBER == 1 && item.IS_VISIBLE) {
				filterData.push(this);
			}
		});	
		filterData.sort(function(a, b) { 
			return a.SORT_ORDER > b.SORT_ORDER;
		});		
		var length = filterData.length - 1;
		var i = 0;
		$.each(filterData, function (index, value) {
			var isEven = pri.isEvenNumber(i);
			if (isEven) {
				html += '<div class="form-row">';
			}
			html += pri.generateHtmlControl(value);
			if (!isEven || i == length) {
				html += '</div>'
			}
			i++;		
		});
		div.append(html);
		pri.renderReviewAndSignScreen();
	}
	pri.isEvenNumber = function (value) {
		if (value % 2 == 0) {
			return true;
		}
		else {
			return false;
		}
	}
	pri.generateHtmlControl = function (item) {
		var cssClass = 'form-group col-md-6 ';
		var event = 'onclick="App.removeClass(this,\'is-invalid\')" ';
		if(!item.IS_VISIBLE){
			cssClass = 'hide';
		}
		var inputType = pri.controlType(item.DATA_TYPE);
		if(inputType == 'number' && item.DATA_TYPE == 'I'){
			event += "onkeypress='return event.charCode >= 48 && event.charCode <= 57'"
		}
		return '<div class="'+cssClass+'">' +
			'<label for="' + item.FIELD_NAME + '">' + item.FIELD_LABEL + '</label>' +
			'<input type="' + inputType + '" '+event+' class="form-control" value="'+item.FIELD_INIT+'" id="' + item.FIELD_NAME + '" placeholder="Enter ' + item.FIELD_LABEL + '"></div>';
	};
	pri.renderReviewAndSignScreen = function(){
		var dynamicFields = [];
		$.each(pri.formData, function(index, item){
			if (item.PAGE_NUMBER == 0 && item.IS_VISIBLE) {
				dynamicFields.push(item);	
			}
		});		
		dynamicFields.sort(function(a, b) { 
			return a.SORT_ORDER < b.SORT_ORDER;
		});		
		var div = $('#signature-section');
		div.empty();
		var html = '';		
		$.each(dynamicFields, function(index, item){
			html += '<div class="form-group">'+ pri.generateOneColumnControl(item) + '</div>';
		});
		if(pri.hasSignature){
			html += '<button type="button" onclick="App.previewSignature()" class="btn btn-success margin-right-10">Preview</button>';
		}
		div.append(html);
	}
	pri.generateOneColumnControl = function (item) {		
		var event = 'onclick="App.removeClass(this,\'is-invalid\')" ';		
		var inputType = pri.controlType(item.DATA_TYPE);
		if(inputType == 'number' && item.DATA_TYPE == 'I'){
			event += "onkeypress='return event.charCode >= 48 && event.charCode <= 57'"
		}
		if(inputType == 'checkbox'){
			return '<label class="custom-control custom-checkbox">'+
						'<input type="checkbox" id="'+item.FIELD_NAME+'" class="custom-control-input">'+
						'<span class="custom-control-indicator"></span>' + 
						'<span class="custom-control-description">'+item.FIELD_LABEL+'</span>' + 
					'</label>';
		}
		if(inputType == 'signature'){
			pri.hasSignature = true;
			return '<label for="' + item.FIELD_NAME + '">' + item.FIELD_LABEL + '</label>' +
					'<div class="wrapper"><canvas id="' + item.FIELD_NAME + '" class="signature-pad" width=350 height=150></canvas></div>' +
					'<div class="custom-row"><button type="button" onclick="App.clearSignature(' + item.FIELD_NAME + ')" class="btn btn-success">Clear</button></div>';
		}
		else{
			return	'<label for="' + item.FIELD_NAME + '">' + item.FIELD_LABEL + '</label>' +
					'<input type="' + inputType + '" '+event+' class="form-control" value="'+item.FIELD_INIT+'" id="' + item.FIELD_NAME + '" placeholder="Enter ' + item.FIELD_LABEL + '">';
		}
		
	};
	pri.controlType = function (value) {
		var controlType = 'text';
		switch (value) {
			case 'A':
				controlType = 'text';
				break;
			case 'D':
				controlType = 'date';
				break;
			case 'I':
				controlType = 'number';
				break;
			case 'N':
				controlType = 'number';
				break;
				case 'E':
				controlType = 'email';
				break;
			case 'S':
				controlType = 'signature';
				break;
			case 'B':
				controlType = 'checkbox';
				break;
		}
		return controlType;
	}
	
	pri.validateEmail = function(email){
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}
	pri.validateAttributes = function(){
		var errorMsg = '';
		$.each(pri.formData, function(index, item){
			if (item.PAGE_NUMBER == 1 && item.IS_MANDATORY && item.IS_VISIBLE) {				
				if(item.DATA_TYPE == 'E' && $('#'+item.FIELD_NAME).val() && !pri.validateEmail($('#'+item.FIELD_NAME).val())){
					errorMsg += '<li>Enter valid email address</li>'
					$('#'+item.FIELD_NAME).removeClass('is-invalid').addClass('is-invalid');
				}
				else if(!$('#'+item.FIELD_NAME).val()){
					errorMsg += '<li>'+item.FIELD_LABEL+' required</li>'
					$('#'+item.FIELD_NAME).removeClass('is-invalid').addClass('is-invalid');
				}
			}
		});
		if (errorMsg != "") {
			$('#validation-message').empty();
            $('#validation-message').html('<ul class="validation-summary-errors">'+ errorMsg + '</ul>');
            return false;
		}
		return true;		
	}
	pub.removeClass = function(element, cssClass){
		$(element).removeClass(cssClass);
	}
	pri.registerSignaturePad = function(){
		$.each(pri.formData, function(index, item){
			if (item.PAGE_NUMBER == 0 && item.DATA_TYPE == 'S' && item.IS_VISIBLE) {
				var signaturePad = new SignaturePad(document.getElementById(item.FIELD_NAME), {
					backgroundColor: 'rgba(255, 255, 255, 0)',
					penColor: 'rgb(0, 0, 0)'
				  });	
				  pri[item.FIELD_NAME] = signaturePad;	
			}
		});
		
	}
	pri.cropSignatureCanvas = function (canvas) {
		// First duplicate the canvas to not alter the original
		var croppedCanvas = document.createElement('canvas'),
			croppedCtx = croppedCanvas.getContext('2d');

		croppedCanvas.width = canvas.width;
		croppedCanvas.height = canvas.height;
		croppedCtx.drawImage(canvas, 0, 0);

		// Next do the actual cropping
		var w = croppedCanvas.width,
			h = croppedCanvas.height,
			pix = { x: [], y: [] },
			imageData = croppedCtx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height),
			x, y, index;

		for (y = 0; y < h; y++) {
			for (x = 0; x < w; x++) {
				index = (y * w + x) * 4;
				if (imageData.data[index + 3] > 0) {
					pix.x.push(x);
					pix.y.push(y);
				}
			}
		}
		pix.x.sort(function (a, b) { return a - b });
		pix.y.sort(function (a, b) { return a - b });
		var n = pix.x.length - 1;

		w = pix.x[n] - pix.x[0];
		h = pix.y[n] - pix.y[0];
		if(!w || !h)
		{
			return null;
		}
		var cut = croppedCtx.getImageData(pix.x[0], pix.y[0], w, h);

		croppedCanvas.width = w;
		croppedCanvas.height = h;
		croppedCtx.putImageData(cut, 0, 0);
		var size = pri.resizeImage(croppedCanvas.width,croppedCanvas.height,57, 20);
		return {data: croppedCanvas.toDataURL(), width: size[0],height: size[1]};
	}
	pri.resizeImage = function(width, height, maxWidth, maxHeight, ratio ){		
        // Check if the current width is larger than the max
        if(width > maxWidth){
            ratio = maxWidth / width;   // get ratio for scaling image           
            height = height * ratio;    // Reset height to match scaled image
            width = width * ratio;    // Reset width to match scaled image
        }
        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image           
            width = width * ratio;    // Reset width to match scaled image
            height = height * ratio;    // Reset height to match scaled image
		}
		return [width, height]
	 };
	 pri.isCanvasBlank = function(canvas){
		var blank = document.createElement('canvas');
		blank.width = canvas.width;
		blank.height = canvas.height;	
		return canvas.toDataURL() == blank.toDataURL();
	 };
	return pub;
}();
// kick it
////////////////////////////////////////////////////////////////////////////////
$( document ).ready(function() {
    App.loadFormulary();
	$('#formulary-table').on('click', '.table-row', function () {
		var value = $(this).attr("data-value");
		App.selectaFormulary(this, value);
	});	
	$('#error-message-modal').on('hidden.bs.modal', function (e) {
		if(App.isSaveSuccessfully){
			App.isSaveSuccessfully = false;
			window.location.reload(true);
		} 		
	  })
});
//==============================================================================
// EOS