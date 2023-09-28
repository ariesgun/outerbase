var privileges = [
    'cellValue',
    'configuration',
]

var templateCell_$PLUGIN_ID = document.createElement('template')
templateCell_$PLUGIN_ID.innerHTML = `
<style>
    #container { 
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: space-between;
        height: 100%;
        width: calc(100% - 16px);
        padding: 0 8px;
    }

    input {
        height: 100%;
        flex: 1;
        background-color: transparent;
        border: 0;
        min-width: 0;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    input:focus {
        outline: none;
    }
</style>

<div id="container">
    <input type="text" id="image-value" placeholder="Enter URL...">
    <button id="view-image"></button>
</div>
`

var templateEditor_$PLUGIN_ID = document.createElement('template')
templateEditor_$PLUGIN_ID.innerHTML = `
<style>
    #container {
        max-width: 400px;
    }

    #image-old {
        width: 100%;
        height: 100%;
    }

    #image {
        background-size: contain;
        background-repeat: no-repeat;
        max-width: 400px;
    }

    #map {
        height: 400px;
        width: 500px;
    }

    #background-image {
        background-repeat: no-repeat;
        background-size: contain;
    }
</style>

<div id="container">
    <div id="background-image">
        <div id="map"/>
    </div>
</div>
`

// This is the configuration object that Outerbase passes to your plugin.
// Define all of the configuration options that your plugin requires here.
class OuterbasePluginConfig_$PLUGIN_ID {
    constructor(object) {
        // No custom properties needed in this plugin.
    }
}

class OuterbasePluginCell_$PLUGIN_ID extends HTMLElement {
    static get observedAttributes() {
        return privileges
    }

    config = new OuterbasePluginConfig_$PLUGIN_ID({})

    constructor() {
        super()

        // The shadow DOM is a separate DOM tree that is attached to the element.
        // This allows us to encapsulate our styles and markup. It also prevents
        // styles from the parent page from leaking into our plugin.
        this.shadow = this.attachShadow({ mode: 'open' })
        this.shadow.appendChild(templateCell_$PLUGIN_ID.content.cloneNode(true))

        if (window.plugin_maps === undefined) {
            window.plugin_maps = {};
        }
        const cellValue = this.getAttribute('cellValue');
        if (!(cellValue in window.plugin_maps)) {
            window.plugin_maps[cellValue] = false;
        }

        if (window.plugin_maps[this.getAttribute('cellValue')]) {
            this.shadow.getElementById("view-image").innerHTML = 'Close'
        } else {
            this.shadow.getElementById("view-image").innerHTML = 'View'
        }
    }

    // This function is called when the UI is made available into the DOM. Put any
    // logic that you want to run when the element is first stood up here, such as
    // event listeners, default values to display, etc.
    connectedCallback() {
        // Parse the configuration object from the `configuration` attribute
        // and store it in the `config` property.
        this.config = new OuterbasePluginConfig_$PLUGIN_ID(
            JSON.parse(this.getAttribute('configuration'))
        )

        // Set default value based on input
        this.shadow.querySelector('#image-value').value = this.getAttribute('cellvalue')

        var imageInput = this.shadow.getElementById("image-value");
        var viewImageButton = this.shadow.getElementById("view-image");

        if (imageInput && viewImageButton) {
            imageInput.addEventListener("focus", () => {
                // Tell Outerbase to start editing the cell
                viewImageButton.innerHTML = 'View'
                this.callCustomEvent({
                    action: 'onstopedit',
                    value: true
                })
            });

            imageInput.addEventListener("blur", () => {
                // Tell Outerbase to update the cells raw value
                this.callCustomEvent({
                    action: 'cellvalue',
                    value: imageInput.value
                })

                // Then stop editing the cell and close the editor view
                this.callCustomEvent({
                    action: 'onstopedit',
                    value: true
                })
            });

            viewImageButton.addEventListener("click", () => {
                const action = (viewImageButton.innerHTML === 'View') ? 'onedit' : 'onstopedit'
                viewImageButton.innerHTML = (viewImageButton.innerHTML === 'View') ? 'Close' : 'View';
                window.plugin_maps[this.getAttribute('cellvalue')] = (viewImageButton.innerHTML === 'Close')
                this.callCustomEvent({
                    action: action,
                    value: true
                })
            });
        }
    }

    callCustomEvent(data) {
        const event = new CustomEvent('custom-change', {
            detail: data,
            bubbles: true,  // If you want the event to bubble up through the DOM
            composed: true  // Allows the event to pass through shadow DOM boundaries
        });

        this.dispatchEvent(event);
    }
}

class OuterbasePluginEditor_$PLUGIN_ID extends HTMLElement {
    static get observedAttributes() {
        return privileges
    }

    constructor() {
        super()

        // The shadow DOM is a separate DOM tree that is attached to the element.
        // This allows us to encapsulate our styles and markup. It also prevents
        // styles from the parent page from leaking into our plugin.
        this.shadow = this.attachShadow({ mode: 'open' })
        this.shadow.appendChild(templateEditor_$PLUGIN_ID.content.cloneNode(true))

        // Parse the configuration object from the `configuration` attribute
        // and store it in the `config` property.
        this.config = new OuterbasePluginConfig_$PLUGIN_ID(
            JSON.parse(this.getAttribute('configuration'))
        )

        const apiKey = "AIzaSyD-YzEq-gyCy9vFQVo_W5u-XM5FFoWtwP8"
        if (window.gmap === undefined) {
            this.loadExternalScript(`//maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker&v=beta&callback=initMap`)
        }
    }

    loadExternalScript(url) {
        var init_script = document.createElement('script')
        init_script.type = 'text/javascript'
        init_script.innerHTML = `
            async function initMap() {
                // Request needed libraries.
                console.log("Map init")
        
                const { Map, InfoWindow } = await google.maps.importLibrary("maps");
                const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

                const plugins = document.querySelectorAll("#plugin-component")
                for (const plugin of plugins) {

                    const mapEl = plugin.shadowRoot.getElementById("map")
                    if (mapEl) {
                        if (window.gmap === undefined) {
                            window.gmap = new Map(mapEl, {
                                center: { lat: 37.39094933041195, lng: -122.02503913145092 },
                                zoom: 14,
                                mapId: "4504f8b37365c3d0",
                            });
                        }

                        window.customElements.whenDefined(plugin.localName).then(() => {
                            plugin.render()
                        })
                    }
                }
            }
        `

        document.head.appendChild(init_script);

        const script = document.createElement('script');
        script.type = 'text/javascript'
        script.src = url;
        script.defer = true
        script.async = true

        document.head.appendChild(script);
    }

    // This function is called when the UI is made available into the DOM. Put any
    // logic that you want to run when the element is first stood up here, such as
    // event listeners, default values to display, etc.
    connectedCallback() {
        var imageView = this.shadow.getElementById("map");
        var backgroundImageView = this.shadow.getElementById("background-image");

        if (imageView && backgroundImageView) {
            imageView.src = this.getAttribute('cellvalue')
            backgroundImageView.style.backgroundImage = `url(${this.getAttribute('cellvalue')})`
        }

        this.render()
    }

    render() {
        if (window.gmap) {

            window.gmap = new google.maps.Map(this.shadowRoot.getElementById("map"), {
                center: { lat: 37.39094933041195, lng: -122.02503913145092 },
                zoom: 14,
                mapId: "4504f8b37365c3d0",
            });

            const marker = new google.maps.Marker({
                map: window.gmap
            });
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: this.getAttribute('cellvalue')})
            .then((result) => {
                const { results } = result;

                window.gmap.setCenter(results[0].geometry.location);
                marker.setPosition(results[0].geometry.location);
                marker.setMap(window.gmap);
                return results;
            })
            .catch((e) => {
                alert("Geocode was not successful for the following reason: " + e);
            });
        }
    }
}

// DO NOT change the name of this variable or the classes defined in this file.
// Changing the name of this variable will cause your plugin to not work properly
// when installed in Outerbase.
window.customElements.define('outerbase-plugin-cell-$PLUGIN_ID', OuterbasePluginCell_$PLUGIN_ID)
window.customElements.define('outerbase-plugin-editor-$PLUGIN_ID', OuterbasePluginEditor_$PLUGIN_ID)