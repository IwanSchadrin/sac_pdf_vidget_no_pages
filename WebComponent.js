(function () {
    let _shadowRoot;
    let _date;
    let _id;

    let tmpl = document.createElement('template');
    tmpl.innerHTML = `
    <style>
    </style>
    <div id="ui5_content" name="ui5_content">
       <slot name="content"></slot>
    </div>
      <script id="oView" name="oView" type="sapui5/xmlview">
          <mvc:View
              controllerName="myView.Template"
              xmlns:mvc="sap.ui.core.mvc"
              xmlns="sap.m"
              height="100%">                      
                      <Link id="linkDisplayPopup" text="Show popup" press=".onShowPopupLinkPress"/>  
          </mvc:View>
      </script>  
    `;

    customElements.define('com-openpromos-sac-pdf-vidget', class PDFViewer extends HTMLElement {
        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));

            _id = createGuid();

            _shadowRoot.querySelector("#oView").id = _id + "_oView";

            this._firstConnection = 0;
        }

        //Fired when the widget is added to the html DOM of the page
        connectedCallback() {
            this._firstConnection = true;
            loadthis(this);
        }

        //Fired when the widget is removed from the html DOM of the page (e.g. by hide)
        disconnectedCallback() {
        }

        //When the custom widget is updated, the Custom Widget SDK framework executes this function first
        onCustomWidgetBeforeUpdate(oChangedProperties) {
        }

        //When the custom widget is updated, the Custom Widget SDK framework executes this function after the update
        onCustomWidgetAfterUpdate(oChangedProperties) {
            if (oChangedProperties.hasOwnProperty("popupTitle")) {
                this._popupTitle = oChangedProperties.popupTitle;
            }
            if (oChangedProperties.hasOwnProperty("pdfUrl")) {
                this._pdfUrl = oChangedProperties.pdfUrl;
            }
            if (oChangedProperties.hasOwnProperty("displayLink")) {
                this._displayLink = oChangedProperties.displayLink;
            }
            if (this._firstConnection) {
                loadthis(this);
            }
        }

        //When the custom widget is removed from the canvas or the analytic application is closed
        onCustomWidgetDestroy() {
        }

        //When the custom widget is resized on the canvas, the Custom Widget SDK framework executes the following JavaScript function call on the custom widget
        // Commented out by default.  If it is enabled, SAP Analytics Cloud will track DOM size changes and call this callback as needed
        //  If you don't need to react to resizes, you can save CPU by leaving it uncommented.
        /*
        onCustomWidgetResize(width, height){
        
        }
        */

        displayPDFInPopup(){
            if (this._oPdfController){
                this._oPdfController.dipslayPDFPopup();
            }
        }

        set pdfUrl(newPdfUrl) {
            this._pdfUrl = newPdfUrl;
        }

        get pdfUrl() {
            return this._pdfUrl;
        }

        set popupTitle(newPopupTitle) {
            this._popupTitle = newPopupTitle;
        }

        get popupTitle() {
            return this._popupTitle;
        }

        set displayLink(bDisplayLink) {
            this._displayLink = bDisplayLink;
        }

        get displayLink() {
            return this._displayLink;
        }

    });

    // UTILS
    function loadthis(that) {
        var that_ = that;
        this._firstConnection = false;

        if (that_.children.length !== 0) {
            return;
        }

        let content = document.createElement('div');
        content.slot = "content";
        that_.appendChild(content);



        // that_._renderExportButton();

        sap.ui.getCore().attachInit(function () {
            "use strict";

            //### Controller ###
            sap.ui.define([
                "jquery.sap.global",
                "sap/ui/core/mvc/Controller",
                "sap/ui/model/json/JSONModel",
                "sap/m/MessageToast",
                "sap/ui/core/library",
                "sap/ui/core/Core",
                "sap/m/PDFViewer"
            ], function (jQuery, Controller, JSONModel, MessageToast, coreLibrary, Core, PDFViewer) {
                "use strict";

                return Controller.extend("myView.Template", {

                    onInit: function () {
                        this._oSACPDFViewerComponent = that;
                        that._oPdfController = this;   
                        
                        this._oDisplayPopupLink = this.getView().byId("linkDisplayPopup");
                    },

                    onBeforeRendering: function(){
                        if (this._oDisplayPopupLink && this._oSACPDFViewerComponent){
                            var bDisplayLink = (this._oSACPDFViewerComponent._displayLink ? true : false );
                            this._oDisplayPopupLink.setVisible(bDisplayLink);
                        }
                    },

                    onloaded: function () {                        
                    },

                    onerror: function () {                        
                    },

                    onShowPopupLinkPress: function () {                        
                        this.dipslayPDFPopup();
                    },

                    onsourceValidationFailed: function (oEvent) {                        
                        oEvent.preventDefault();
                    },

                    _getPdfSource: function () {
                        var sPdfSource = this._oSACPDFViewerComponent.pdfUrl;
                        if (!sPdfSource) {
                            sPdfSource = "";
                        }
                        return sPdfSource;
                    },

                    _getPopupTitle: function () {
                        var sPopupTitle = this._oSACPDFViewerComponent.popupTitle;
                        if (!sPopupTitle) {
                            sPopupTitle = "KPI Steckbrief";
                        }
                        return sPopupTitle;
                    },

                    dipslayPDFPopup: function () {
                        if (!this._oPDFViewer) {
                            this._oPDFViewer = new PDFViewer();
                            this._oPDFViewer.attachSourceValidationFailed(this.onPDFSourceValidationFailed, this);
                        }

                        
                        var sPdfSource = this._getPdfSource();
                        if (sPdfSource){
                            var oPdfSourceUrl = new URL(sPdfSource);
                            jQuery.sap.addUrlWhitelist(oPdfSourceUrl.protocol.replace(":",""), oPdfSourceUrl.hostname);
                            this._oPDFViewer.setSource(sPdfSource);

                            this._oPDFViewer.setTitle(this._getPopupTitle());
                            this._oPDFViewer.open();
                        }
                    },

                    onPDFSourceValidationFailed: function (oEvent) {
                        oEvent.preventDefault();
                    }
                });
            });

            //### THE APP: place the XMLView somewhere into DOM ###
            var oView = sap.ui.xmlview({
                viewContent: jQuery(_shadowRoot.getElementById(_id + "_oView")).html(),
            });

            oView.placeAt(content);
        });
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

})();
