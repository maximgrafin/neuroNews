# Azure Mobile Apps: Javascript Client SDK

With Microsoft Azure Mobile Apps you can add a scalable backend to your connected client applications in minutes. To learn more about Azure Mobile Apps, visit the [Mobile Apps documentation](https://azure.microsoft.com/en-us/documentation/learning-paths/appservice-mobileapps/). 

This repository contains code for the [azure-mobile-apps-client](https://www.npmjs.com/package/azure-mobile-apps-client) npm package and the [cordova-plugin-ms-azure-mobile-apps](https://www.npmjs.com/package/cordova-plugin-ms-azure-mobile-apps) Cordova plugin.

The Cordova plugin is published from the [Azure/azure-mobile-apps-cordova-client](https://github.com/Azure/azure-mobile-apps-cordova-client) repository by bundling source code in this repository. Refer [Azure/azure-mobile-apps-cordova-client](https://github.com/Azure/azure-mobile-apps-cordova-client) for more details about the Cordova plugin.

The following sections explain how to use the [Javascript client SDK](https://www.npmjs.com/package/azure-mobile-apps-client). You can also refer [How to Use the JavaScript Client Library for Azure Mobile Apps](https://azure.microsoft.com/en-us/documentation/articles/app-service-mobile-html-how-to-use-client-library/) for more details.

## Usage instructions

 You can consume the SDK in one of the following ways.

 1. Reference the SDK bundle in HTML's script tag
 2. Use the SDK bundle as a CommonJS module
 3. Use the SDK bundle as an AMD module
 4. Use the SDK as an npm package

The _latest_ SDK bundle is available at https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.js and https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.min.js. 

To use a specific version of the SDK (recommended), use the bundle at https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.__VERSION__.js or https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.__VERSION__.min.js, where \__VERSION\__ represents a valid version.

### Sample usage

Here are a few examples of how you can use the SDK.

#### Use the SDK as a Javascript bundle

```
<html>
<head>
    <script src="https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.2.0.0-beta5.js"></script>
    <script>
        // Create a reference to the Azure App Service
        var clientRef = new WindowsAzure.MobileServiceClient('https://YOUR-SITE-NAME.azurewebsites.net); 
    </script>
</head>
</html>
```

#### Use the SDK as an npm package

Install the SDK from npm: `npm install azure-mobile-apps-client`

OR

Install the SDK from github: `npm install azure/azure-mobile-apps-js-client`

You can now use it in your Javascript code as follows:
```
var WindowsAzure = require('azure-mobile-apps-client');
// Create a reference to the Azure App Service
var clientRef = new WindowsAzure.MobileServiceClient('https://YOUR-SITE-NAME.azurewebsites.net);
```

You can bundle your Javascript code using either [WebPack](https://webpack.github.io/) or [Browserify](http://browserify.org/).
    
## Offline data sync (Preview)

[This page](./offline-sync.md) explains the offline data sync feature in detail.

## API documentation

Refer https://azure.github.io/azure-mobile-apps-js-client for detailed documentation of the APIs.

## SDK downloads

- latest [unminified](https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.2.0.0-beta5.js) and [minified](https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.2.0.0-beta5.min.js)
- version 2.0.0-beta5 [unminified](https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.2.0.0-beta5.js) and [minified](https://zumo.blob.core.windows.net/sdk/azure-mobile-apps-client.2.0.0-beta5.min.js)

## Build instructions

To build the SDK bundle yourself, follow these steps:
```
git clone https://github.com/Azure/azure-mobile-apps-js-client.git
cd azure-mobile-apps-js-client
npm install
npm run build
```

The built files will be copied to the `/dist` directory. The bundles for use by a web app in a browser are _azure-mobile-apps-client.js_ and _azure-mobile-apps-client.min.js_. The bundle for use by the [azure/azure-mobile-apps-cordova-client](https://github.com/Azure/azure-mobile-apps-cordova-client) repository is _azure-mobile-apps-client-cordova.js_.

## Running Unit Tests

To run unit tests for the browser, run:
```
npm run browserut
```

## Future work

Brief list of work planned in the future:
- ability to cancel push and pull operations
- triggering a push automatically when a pull is performed
- support for math and date/time functions while querying for records
- callback to allow changing how records are sent to the server during a push
- configurable ID column. Currently ID column has to be named 'id'.

All these will be added over a series of updates in the next few days. Stay tuned!

## Useful Resources

* [Getting Started with Azure Mobile Apps](https://azure.microsoft.com/en-us/documentation/learning-paths/appservice-mobileapps/)
* [Quickstart](https://azure.microsoft.com/en-us/documentation/articles/app-service-mobile-html-how-to-use-client-library/)
* [Azure Mobile Apps Cordova plugin](https://github.com/Azure/azure-mobile-apps-cordova-client)
* Tutorials and product overview are available at [Microsoft Azure Mobile Apps Developer Center](http://azure.microsoft.com/en-us/develop/mobile).
* Our product team actively monitors the [Mobile Services Developer Forum](http://social.msdn.microsoft.com/Forums/en-US/azuremobile/) to assist you with any troubles.

## Contribute Code or Provide Feedback

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

If you would like to become an active contributor to this project please follow the instructions provided in [Microsoft Azure Projects Contribution Guidelines](http://azure.github.com/guidelines.html).

If you encounter any bugs with the library please file an issue in the [Issues](https://github.com/Azure/azure-mobile-apps-js-client/issues) section of the project.
