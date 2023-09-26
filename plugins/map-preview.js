var observableAttributes = [
    // The value of the cell that the plugin is being rendered in
    "cellvalue",
    // The value of the row that the plugin is being rendered in
    "rowvalue",
    // The value of the table that the plugin is being rendered in
    "tablevalue",
    // The schema of the table that the plugin is being rendered in
    "tableschemavalue",
    // The schema of the database that the plugin is being rendered in
    "databaseschemavalue",
    // The configuration object that the user specified when installing the plugin
    "configuration",
    // Additional information about the view such as count, page and offset.
    "metadata"
]

var OuterbaseEvent = {
    // The user has triggered an action to save updates
    onSave: "onSave",
}

var OuterbaseColumnEvent = {
    // The user has began editing the selected cell
    onEdit: "onEdit",
    // Stops editing a cells editor popup view and accept the changes
    onStopEdit: "onStopEdit",
    // Stops editing a cells editor popup view and prevent persisting the changes
    onCancelEdit: "onCancelEdit",
    // Updates the cells value with the provided value
    updateCell: "updateCell",
}

var OuterbaseTableEvent = {
    // Updates the value of a row with the provided JSON value
    updateRow: "updateRow",
    // Deletes an entire row with the provided JSON value
    deleteRow: "deleteRow",
    // Creates a new row with the provided JSON value
    createRow: "createRow",
    // Performs an action to get the next page of results, if they exist
    getNextPage: "getNextPage",
    // Performs an action to get the previous page of results, if they exist
    getPreviousPage: "getPreviousPage"
}

/**
 * ******************
 * Custom Definitions
 * ******************
 * 
 *  ░░░░░░░░░░░░░░░░░
 *  ░░░░▄▄████▄▄░░░░░
 *  ░░░██████████░░░░
 *  ░░░██▄▄██▄▄██░░░░
 *  ░░░░▄▀▄▀▀▄▀▄░░░░░
 *  ░░░▀░░░░░░░░▀░░░░
 *  ░░░░░░░░░░░░░░░░░
 * 
 * Define your custom classes here. We do recommend the usage of our `OuterbasePluginConfig_$PLUGIN_ID`
 * class for you to manage properties between the other classes below, however, it's strictly optional.
 * However, this would be a good class to contain the properties you need to store when a user installs
 * or configures your plugin.
 */
class OuterbasePluginConfig_$PLUGIN_ID {
    // Inputs from Outerbase for us to retain
    tableValue = undefined
    count = 0
    page = 1
    offset = 50
    theme = "light"

    // Inputs from the configuration screen
    imageKey = undefined
    optionalImagePrefix = undefined
    titleKey = undefined
    descriptionKey = undefined
    subtitleKey = undefined
    longitudeKey = undefined
    latitudeKey = undefined

    // Variables for us to hold state of user actions
    deletedRows = []

    constructor(object) {
        this.imageKey = object?.imageKey
        this.optionalImagePrefix = object?.optionalImagePrefix
        this.titleKey = object?.titleKey
        this.descriptionKey = object?.descriptionKey
        this.subtitleKey = object?.subtitleKey
        this.latitudeKey = object?.latitudeKey
        this.longitudeKey = object?.longitudeKey
    }

    toJSON() {
        return {
            "imageKey": this.imageKey,
            "imagePrefix": this.optionalImagePrefix,
            "titleKey": this.titleKey,
            "descriptionKey": this.descriptionKey,
            "subtitleKey": this.subtitleKey,
            "latitudeKey": this.latitudeKey,
            "longitudeKey": this.longitudeKey
        }
    }
}

var triggerEvent = (fromClass, data) => {
    const event = new CustomEvent("custom-change", {
        detail: data,
        bubbles: true,
        composed: true
    });

    fromClass.dispatchEvent(event);
}

var decodeAttributeByName = (fromClass, name) => {
    const encodedJSON = fromClass.getAttribute(name);
    const decodedJSON = encodedJSON
        ?.replace(/&quot;/g, '"')
        ?.replace(/&#39;/g, "'");
    return decodedJSON ? JSON.parse(decodedJSON) : {};
}


/**
 * **********
 * Table View
 * **********
 * 
 *  ░░░░░░░░░░░░░░░░░░
 *  ░░░░░▄▄████▄▄░░░░░
 *  ░░░▄██████████▄░░░
 *  ░▄██▄██▄██▄██▄██▄░
 *  ░░░▀█▀░░▀▀░░▀█▀░░░
 *  ░░░░░░░░░░░░░░░░░░
 *  ░░░░░░░░░░░░░░░░░░
 */
var templateTable = document.createElement("template")
templateTable.innerHTML = `
<style>
    #theme-container {
        height: 100%;
    }

    #container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow-y: scroll;
    }

    gmp-map {
      height: 800px;
    }

    .grid-container {
        flex: 1;
        gap: 12px;
        padding: 12px;
    }

    .grid-item {
        position: relative;
        display: flex;
        flex-direction: column;
        background-color: transparent;
        border: 1px solid rgb(238, 238, 238);
        border-radius: 4px;
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);
        overflow: clip;
    }

    .subtitle {
        font-size: 12px;
        line-height: 16px;
        font-family: "Inter", sans-serif;
        color: gray;
        font-weight: 300;
        margin-top: 8px;
    }

    p {
        margin: 0;
    }

    .dark {
        #container {
            background-color: black;
            color: white;
        }
    }

</style>

<div id="theme-container">
    <div id="container">
        
    </div>
</div>
`
// Can the above div just be a self closing container: <div />

var script = document.createElement('script')
script.type = 'text/javascript'
script.async = true
script.src = "//maps.googleapis.com/maps/api/js?key=AIzaSyD-YzEq-gyCy9vFQVo_W5u-XM5FFoWtwP8&libraries=maps,marker&v=beta&callback=initMap";

class OuterbasePluginTable_$PLUGIN_ID extends HTMLElement {
    static get observedAttributes() {
        return observableAttributes
    }

    config = new OuterbasePluginConfig_$PLUGIN_ID({})

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })	
	    this.shadow.appendChild(script)
        this.shadow.appendChild(templateTable.content.cloneNode(true))
    }

    connectedCallback() {
        this.render()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.config = new OuterbasePluginConfig_$PLUGIN_ID(decodeAttributeByName(this, "configuration"))
        this.config.tableValue = decodeAttributeByName(this, "tableValue")
        this.config.theme = decodeAttributeByName(this, "metadata").theme

        var element = this.shadow.getElementById("theme-container");
        element.classList.remove("dark")
        element.classList.add(this.config.theme);

        this.render()
    }

    render() {
        this.shadow.querySelector("#container").innerHTML = `
        <div class="grid-container">
            <h1>Welcome to the Outerbase Car Dealership!</h1>
            <div class="grid-item">
                <gmp-map id="marker-click-event-example" center="43.4142989,-124.2301242" gmpDraggable="true" zoom="4" map-id="DEMO_MAP_ID">
                    ${this.config?.tableValue?.length && this.config?.tableValue?.map((row) => `
                        <gmp-advanced-marker position="${row[this.config.latitudeKey]},${row[this.config.longitudeKey]}" title=${row[this.config.titleKey]} 
                            data=title='${row[this.config.titleKey]}'
                            data-image='${row[this.config.imageKey]}'
                            data-description='${row[this.config.descriptionKey]}'
                            data-subtitle='${row[this.config.subtitleKey]}'
                        >
                        </gmp-advanced-marker>
                    `).join("")}
                </gmp-map>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <h1>What Next?</h1>
                <button id="previousPageButton">Previous Page</button>
                <button id="nextPageButton"}>Next Page</button>
            </div>
        </div>
        `
        
        const advancedMarkers = this.shadow.querySelectorAll("#marker-click-event-example gmp-advanced-marker");
        for (const advancedMarker of advancedMarkers) {
            customElements.whenDefined(advancedMarker.localName).then(async () => {
                advancedMarker.addEventListener('gmp-click', async () => {
                    console.log('Clicked', this.infoWindow)

                    if (this.infoWindow) {
                        this.infoWindow.close()
                    }

                    const {InfoWindow} = await google.maps.importLibrary("maps");

                    const content = document.createElement('div');
                    content.classList.add("property")
                    content.innerHTML = `
                        <style>
                            #theme-container {
                                height: 100%;
                            }

                            #container {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                                overflow-y: hidden;
                                width: 450px;
                            }

                            .grid-container {
                                flex: 1;
                                display: grid;
                                // grid-template-columns: repeat(2, minmax(0, 1fr));
                                gap: 12px;
                                padding: 12px;
                            }

                            .grid-item {
                                position: relative;
                                display: flex;
                                flex-direction: column;
                                background-color: transparent;
                                border: 1px solid rgb(238, 238, 238);
                                border-radius: 4px;
                                box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);
                                overflow: clip;
                            }

                            img {
                                vertical-align: top;
                                height: 300px;
                                object-fit: cover;
                            }

                            .contents {
                                padding: 12px;
                            }

                            .title {
                                font-weight: bold;
                                font-size: 16px;
                                line-height: 24px;
                                font-family: "Inter", sans-serif;
                                line-clamp: 2;
                                margin-bottom: 8px;
                            }

                            .description {
                                flex: 1;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                font-size: 14px;
                                line-height: 20px;
                                font-family: "Inter", sans-serif;

                                display: -webkit-box;
                                -webkit-line-clamp: 3;
                                -webkit-box-orient: vertical;  
                                overflow: hidden;
                            }

                            .subtitle {
                                font-size: 12px;
                                line-height: 16px;
                                font-family: "Inter", sans-serif;
                                color: gray;
                                font-weight: 300;
                                margin-top: 8px;
                            }

                            p {
                                margin: 0;
                            }

                            .dark {
                                #container {
                                    background-color: black;
                                    color: white;
                                }
                            }
                        </style>
                        
                        <div id="theme-container">
                            <div id="container">
                                 <div class="grid-item">
                                    ${ advancedMarker.dataset.image ? `<img src="${advancedMarker.dataset.image}">` : `` }

                                    <div class="contents">
                                        ${ advancedMarker.dataset.title ? `<p class="title">${advancedMarker.dataset.title}</p>` : `` }
                                        ${ advancedMarker.dataset.subtitle ? `<p class="subtitle">${advancedMarker.dataset.subtitle}</p>` : `` }
                                        ${ advancedMarker.dataset.description ? `<p class="description">${advancedMarker.dataset.description}</p>` : `` }
                                    </div>
                                </div>
                            </div>
                        </div>
                       
                    `

                    this.infoWindow = new InfoWindow({
                        content: content
                    });
                    this.infoWindow.open({
                        anchor: advancedMarker
                    });

                });
            });
        }

        var previousPageButton = this.shadow.getElementById("previousPageButton");
        previousPageButton.addEventListener("click", () => {
            triggerEvent(this, {
                action: OuterbaseTableEvent.getPreviousPage,
                value: {}
            })
        });

        var nextPageButton = this.shadow.getElementById("nextPageButton");
        nextPageButton.addEventListener("click", () => {
            triggerEvent(this, {
                action: OuterbaseTableEvent.getNextPage,
                value: {}
            })
        });
    }
}


/**
 * ******************
 * Configuration View
 * ******************
 * 
 *  ░░░░░░░░░░░░░░░░░
 *  ░░░░░▀▄░░░▄▀░░░░░
 *  ░░░░▄█▀███▀█▄░░░░
 *  ░░░█▀███████▀█░░░
 *  ░░░█░█▀▀▀▀▀█░█░░░
 *  ░░░░░░▀▀░▀▀░░░░░░
 *  ░░░░░░░░░░░░░░░░░
 * 
 * When a user either installs a plugin onto a table resource for the first time
 * or they configure an existing installation, this is the view that is presented
 * to the user. For many plugin applications it's essential to capture information
 * that is required to allow your plugin to work correctly and this is the best
 * place to do it.
 * 
 * It is a requirement that a save button that triggers the `OuterbaseEvent.onSave`
 * event exists so Outerbase can complete the installation or preference update
 * action.
 */
var templateConfiguration = document.createElement("template")
templateConfiguration.innerHTML = `
<style>
    #configuration-container {
        display: flex;
        height: 100%;
        overflow-y: scroll;
        padding: 40px 50px 65px 40px;
    }

    .field-title {
        font: "Inter", sans-serif;
        font-size: 12px;
        line-height: 18px;
        font-weight: 500;
        margin: 0 0 8px 0;
    }

    select {
        width: 320px;
        height: 40px;
        margin-bottom: 16px;
        background: transparent;
        border: 1px solid #343438;
        border-radius: 8px;
        color: black;
        font-size: 14px;
        padding: 0 8px;
        cursor: pointer;
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 -960 960 960" width="32"><path fill="black" d="M480-380 276-584l16-16 188 188 188-188 16 16-204 204Z"/></svg>');
        background-position: 100%;
        background-repeat: no-repeat;
        appearance: none;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
    }

    input {
        width: 320px;
        height: 40px;
        margin-bottom: 16px;
        background: transparent;
        border: 1px solid #343438;
        border-radius: 8px;
        color: black;
        font-size: 14px;
        padding: 0 8px;
    }

    button {
        border: none;
        background-color: #834FF8;
        color: white;
        padding: 6px 18px;
        font: "Inter", sans-serif;
        font-size: 14px;
        line-height: 18px;
        border-radius: 8px;
        cursor: pointer;
    }

    .preview-card {
        margin-left: 80px;
        width: 240px;
        background-color: white;
        border-radius: 16px;
        overflow: hidden;
    }

    .preview-card > img {
        width: 100%;
        height: 165px;
    }

    .preview-card > div {
        padding: 16px;
        display: flex; 
        flex-direction: column;
        color: black;
    }

    .preview-card > div > p {
        margin: 0;
    }

    .dark {
        #configuration-container {
            background-color: black;
            color: white;
        }
    }

    .dark > div > div> input {
        color: white !important;
    }

    .dark > div > div> select {
        color: white !important;
        background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="28" viewBox="0 -960 960 960" width="32"><path fill="white" d="M480-380 276-584l16-16 188 188 188-188 16 16-204 204Z"/></svg>');
    }
</style>

<div id="theme-container">
    <div id="configuration-container">
        
    </div>
</div>
`
// Can the above div just be a self closing container: <div />

class OuterbasePluginConfiguration_$PLUGIN_ID extends HTMLElement {
    static get observedAttributes() {
        return observableAttributes
    }

    config = new OuterbasePluginConfig_$PLUGIN_ID({})

    constructor() {
        super()

        this.shadow = this.attachShadow({ mode: "open" })
        this.shadow.appendChild(templateConfiguration.content.cloneNode(true))
    }

    connectedCallback() {
        this.render()
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.config = new OuterbasePluginConfig_$PLUGIN_ID(decodeAttributeByName(this, "configuration"))
        this.config.tableValue = decodeAttributeByName(this, "tableValue")
        this.config.theme = decodeAttributeByName(this, "metadata").theme

        var element = this.shadow.getElementById("theme-container");
        element.classList.remove("dark")
        element.classList.add(this.config.theme);

        this.render()
    }

    render() {
        let sample = this.config.tableValue.length ? this.config.tableValue[0] : {}
        let keys = Object.keys(sample)

        if (!keys || keys.length === 0 || !this.shadow.querySelector('#configuration-container')) return

        this.shadow.querySelector('#configuration-container').innerHTML = `
        <div style="flex: 1;">
            <p class="field-title">Image Key</p>
            <select id="imageKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.imageKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <p class="field-title">Image URL Prefix (optional)</p>
            <input type="text" value="" />

            <p class="field-title">Title Key</p>
            <select id="titleKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.titleKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <p class="field-title">Description Key</p>
            <select id="descriptionKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.descriptionKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <p class="field-title">Subtitle Key</p>
            <select id="subtitleKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.subtitleKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <p class="field-title">Longitude Key</p>
            <select id="longitudeKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.longitudeKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <p class="field-title">Latitude Key</p>
            <select id="latitudeKeySelect">
                ` + keys.map((key) => `<option value="${key}" ${key === this.config.latitudeKey ? 'selected' : ''}>${key}</option>`).join("") + `
            </select>

            <div style="margin-top: 8px;">
                <button id="saveButton">Save View</button>
            </div>
        </div>

        <div style="position: relative;">
            <div class="preview-card">
                <img src="${sample[this.config.imageKey]}" width="100" height="100">

                <div>
                    <p style="margin-bottom: 8px; font-weight: bold; font-size: 16px; line-height: 24px; font-family: 'Inter', sans-serif;">${sample[this.config.titleKey]}</p>
                    <p style="margin-bottom: 8px; font-size: 14px; line-height: 21px; font-weight: 400; font-family: 'Inter', sans-serif;">${sample[this.config.descriptionKey]}</p>
                    <p style="margin-top: 12px; font-size: 12px; line-height: 16px; font-family: 'Inter', sans-serif; color: gray; font-weight: 300;">${sample[this.config.subtitleKey]}</p>
                </div>
            </div>
        </div>
        `

        var saveButton = this.shadow.getElementById("saveButton");
        saveButton.addEventListener("click", () => {
            triggerEvent(this, {
                action: OuterbaseEvent.onSave,
                value: this.config.toJSON()
            })
        });

        var imageKeySelect = this.shadow.getElementById("imageKeySelect");
        imageKeySelect.addEventListener("change", () => {
            this.config.imageKey = imageKeySelect.value
            this.render()
        });

        var titleKeySelect = this.shadow.getElementById("titleKeySelect");
        titleKeySelect.addEventListener("change", () => {
            this.config.titleKey = titleKeySelect.value
            this.render()
        });

        var descriptionKeySelect = this.shadow.getElementById("descriptionKeySelect");
        descriptionKeySelect.addEventListener("change", () => {
            this.config.descriptionKey = descriptionKeySelect.value
            this.render()
        });

        var subtitleKeySelect = this.shadow.getElementById("subtitleKeySelect");
        subtitleKeySelect.addEventListener("change", () => {
            this.config.subtitleKey = subtitleKeySelect.value
            this.render()
        });

        var latitudeKeySelect = this.shadow.getElementById("latitudeKeySelect");
        latitudeKeySelect.addEventListener("change", () => {
            this.config.latitudeKey = latitudeKeySelect.value
            this.render()
        });

        var longitudeKeySelect = this.shadow.getElementById("longitudeKeySelect");
        longitudeKeySelect.addEventListener("change", () => {
            this.config.longitudeKey = longitudeKeySelect.value
            this.render()
        });
    }
}

window.customElements.define('outerbase-plugin-table-$PLUGIN_ID', OuterbasePluginTable_$PLUGIN_ID)
window.customElements.define('outerbase-plugin-configuration-$PLUGIN_ID', OuterbasePluginConfiguration_$PLUGIN_ID)
