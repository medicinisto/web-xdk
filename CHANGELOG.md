# Web XDK Change Log

## 4.1.0

* Fixes to Audio Message Large View's poster in small sizes
* Audio/Video file names now include file extension

## 4.1.0-pre1.2

* Large Message Dialog now rerenders title when Message Model state changes
* Message Viewer no longer add click/tap event handlers for its Large Message View
* Action Button now blurs rather than retaining focus on clicking

## 4.1.0-pre1

_Breaking Changes_:

While there have been no major breaking changes, there have been some minor changes that could impact a few customers

* WEB-1779: Now throws error if calling `Layer.UI.setupMixins({...})` after calling `Layer.init()`
    * Previously, this failed silently to apply the mixins
* `Layer.Constants.WIDTH` no longer exists and is no longer used
* Minor CSS Class names and theme changes
* ImageModel no longer has a `url` property; see `fetchUrl(callback)` instead
* `message-type-response-summmary-v2` renamed to `message-type-response-summary-v2`. More is sometimes better. More spell checkering is better than more m's every time.
* `message-type-response-summmary-v1` renamed to `message-type-response-summary-v1`; Most projects should not be using this!

### Message List Avatar Breaking Changes

Previously, hiding and showing of Avatars within the Message List was managed directly via Style sheets:

Avatars were previously shown using `less` variables:

```
@message-item-text-indent: 12px + 12px + 32px;
@mesage-item-show-avatars: block;
```

Avatars were previously hidden using:

```
@message-item-text-indent: 12px + 12px;
@mesage-item-show-avatars: none;
```

These variables are no longer used; Instead, the Message List supports the following properties:

* `conversationView.canShowMyAvatars`: Set to `false` to disable showing Avatars of the current authenticated user
* `conversationView.canShowOtherAvatars`: Set to `false` to disable showing Avatars of other participants in the conversation
* `conversationView.marginWithMyAvatar`: set to a number to indicate how large a margin to use for display name, sent time and message status for message I send, and where my avatar is showing
* `conversationView.marginWithoutMyAvatar`: set to a number to indicate how large a margin to use for display name, sent time and message status for message I send, and where my avatar is hidden
* `conversationView.marginWithOtherAvatar`: set to a number to indicate how large a margin to use for display name, sent time and message status for message I receive and where the sender's avatar is showing
* `conversationView.marginWithoutOtherAvatar`: set to a number to indicate how large a margin to use for display name, sent time and message status for message I receive and where the sender's avatar is hidden
* Assuming that the `canShowMyAvatars` and `canShowOtherAvatars` properties are left alone, avatars are shown if width permits; width settings are as follows:
    * `Layer.Settings.conversationViewWidths.small: 320`: If the width puts the Conversation View in a category smaller than the Small size of 320px, then show no avatars. If the Conversation View is classed as "Small" then only show other participant's avatars not the current user's avatar.
    * `Layer.Settings.conversationViewWidths.medium: 480`: If the Conversation View is categorized as "Medium" or "Large", show all avatars.
    * Settings can be changed from `Layer.init()`

Impact of this change:

* Apps that had taken steps to hide avatars may have them showing again and will need to use the above properties to hide them again
* Apps that used `@message-item-text-indent` to control indentation will no longer have those values be applied

### New Features and Concepts

#### Managing widths and layout

The `settings` that can be passed into `Layer.init()` now accept a `conversationViewWidths` property that is used to redefine when the Conversation View is considered to be Tiny, Small, Medium or Large.  These settings influence the following behaviors:

* Tiny: 0px - 320px
    * Show no avatars in the message list
    * Messages use 95% of the width of the Conversation View
    * `layer-conversation-view-width-tiny` CSS class is added to the View
* Small: 320px - 480px
    * Show avatar for messages received, but not for messages sent
    * Messages use 95% of the width of the Conversation View
    * `layer-conversation-view-width-small` CSS class is added to the View
* Medium: 480px - 640px
    * Show avatar for messages sent and received
    * Messages use 80% of the width of the Conversation View
    * `layer-conversation-view-width-medium` CSS class is added to the View
* Large: 640px and up
    * Show avatar for messages sent and received
    * Messages use 70% of the width of the Conversation View
    * `layer-conversation-view-width-large` CSS class is added to the View

The pixel sizes associated with these values can be customized using:

```javascript
Layer.init({
    conversationViewWidths: {
        small: 400,
        medium:  600,
        large: 800
    }
});
```

Further customizations (for those placing other components in the margins of the Message Items) can be done by setting the amount of width to indent messages when avatars are showing, and when they are hidden:

```javascript
Layer.init({
    mixins: {
        "layer-message-list": {
            properties: {
                marginWithMyAvatar: {
                    value: 98
                },
                marginWithoutMyAvatar: {
                    value: 48
                },
                marginWithOtherAvatar: {
                    value: 90
                },
                marginWithoutOtherAvatar: {
                    value: 40
                }
            }
        }
    }
});
```

The above code changes away from default values used by the Message List for setting margins, and adjusts those margins to account for both the case where My avatar (or other participant's avatars) are showing, as well as the case where they are hidden.

These values may be updated at runtime:

```javascript
myConversationView.nodes.list.marginWithOtherAvatar = 85;
```

#### Large Message Viewer

Messages may now be shown with a Large Message Viewer.  The Large Message Viewer is the `<layer-message-viewer size="large" />` and allows Messages that have registered a large view can use an alternate layout for presenting more detailed information.

Typically, a Message that is setup for the Large Message Viewer:

* Will have registered a Large View; `<layer-audio-message-large-view />` is set by setting the Message Model's static `largeMessageRenderer` as follows: `AudioModel.largeMessageRenderer = 'layer-audio-message-large-view';`
* Typically a Message that supports this will have the `action` (i.e. the action performed when a user taps/clicks) set to `layer-show-large-message`.  For example: `AudioModel.defaultAction = 'layer-show-large-message';`
* A Message that is tapped/clicked and has its action set to `layer-show-large-message` will show within a Dialog; the `<layer-dialog />` widget.

Large Message Views can be displayed anywhere, even outside of the `<layer-dialog />`; however, this is not as well tested as showing these with the Dialog.

Note that only Audio and Video messages have defined Large Message Views at this time.

Developers who have looked at early versions of the Large Message Viewer, the following changes should be noted:

* Renames `layer-open-expanded-view` action to `layer-show-large-message`
* Renames the Model static property `messageRendererExpanded` to `largeMessageRenderer`
* Removes `<layer-message-viewer-expanded/>` in favor of `<layer-message-viewer size='large' />`
    * For the full `<layer-message-viewer-expanded />` experience, put `<layer-message-viewer size='large' />` inside of a `<layer-dialog />`
* Renames `<layer-feedback-message-expanded-view />` to `<layer-feedback-message-large-view />` which is now rendered within the `<layer-message-viewer size='large' />`

These changes impact customers who adopted the incomplete Large Message View prior to its official release.

### New Message Types

* Adds Audio Message
* Adds Video Message

File Upload Button detects if Audio/Video messages are part of the build, and if they are loaded, will send an Audio/Video message based on file type of the selected file.

### Manual Query Class

UI Components that take Queries as inputs can now take raw data using the Manual Query class. This is useful if simply providing raw data received from Layer's servers doesn't serve your use case.  Typically, you'd use this if fetching a list of Conversations, Messages or Identities from your own servers but still want to use Layer's UI Components to render them.


```javascript
var manualQuery = client.createQuery({
  model: Layer.Core.Query.Manual
});
manualQuery.addItems(conversationList);
manualQuery.addItem(conversation25);
conversationListWidget.query = manualQuery;
```

Query data can be manipulated at any time using `addItem()`, `addItems()`, `removeItem()`, `removeItems()` and `reset()`; UI components will rerender as these calls are made.

### Analytics

To help your application track usage patterns of users, 3 analytics events have been added that your application can listen to in order to report usage to your preferred reporting service.

* Message Viewed: similar to Messages Read, but will retrigger whenever a message is reviewed, or continues to be visible
* Message Selected: Whenever a user selects a message in the Message List to trigger its action.
* Carousel Scrolled: reports what carousel items are visible and that the user explicitly scrolled the carousel

### Typescript Support

Basic typescript support has been added to the `npm` repository and is now part of the build process.

#### Refactored Code

* Refactored `Layer.Core.Client` Class
    * Rips out Client Authenticator Parent class of the Layer Client; replaces all of its capabilities via Mixins
    * Migrates all optional components into Mixins

The resulting client should have the same API, but can now be put together to suit different goals, such as our standard usage within a browser, and a new SAPI-Web-XDK repository that allows for parsing and creating Messages/Message Models for use with Layer's Server API.

* Changes to Static Client properties:
    * `CACHE_PURGE_INTERVAL` is now an instance property settable from `Layer.init()` named `cachePurgeInterval`
    * `TimeBetweenReauths` is now an instance property settable from `Layer.init()` named `timeBetweenReauths`
    * `ResetAfterOfflineDuration` is now an instance property settable from `Layer.init()` named `resetAfterOfflineDuration`

Changes to these are potentially breaking changes; its expected however that use of these customizations has not been common.

* Refactored Index Files (WEB-1763):
    * Can import standard build with `import '@layerhq/web-xdk'`
    * Can import minimal build (that includes UI) with `import '@layerhq/web-xdk/index-lite'`
    * Can import minimal build without UI with `import '@layerhq/web-xdk/index-core'`
    * Can import Everything with `import '@layerhq/web-xdk/index-all'`
    * Can import all Message Types with an additional `import '@layerhq/web-xdk/ui/messages'`
    * Adds simplistic dependency injection for switching between utilities for nodejs, Browsers, etc...

Typically its easiest to start development with `index-all` but the above options will help you refine your build as development progresses.

* Refactors Model Classes
    * Most classes in `src/core/models` now support a Mixin mechanism for customizing their capabilities; this is primarily used to customize it for use with Client API vs Server API.
    * Adds `mixins/message-capi` for Client API specific operations for the `Layer.Core.Message` class (Server API operations are in a separate repository)
    * Adds `mixins/message-type-model-capi` for Client API specific operations for the `Layer.Core.MessageType` class (Server API operations are in a separate repository)
    * `Layer.Core.MessagePart` `fetchStream()` method now uses any `part.body` value it already has if it has it

## Websocket fixes

Fixes aimed at websocket stability:

* Changes exponential backoff for websocket reconnect
* Refactors Online State Manager and how it handles invalid websockets
* Adds client events for debugging; see API Reference for details.
  * websocket:connecting
  * websocket:disconnecting
  * websocket:replaying-events
  * websocket:scheduling-reconnect
  * websocket:schedule-reconnect
  * websocket:ignore-skipped-counter
* If multiple anomolies in a websocket connection will not attempt recovery until frequency of such errors is less than once per minute

#### Other Changes

* Image Messages
    * If sent using the File Upload Button (or drag and drop) no longer use the file name as a title; Images default to being sent without a title.
    * If sent without a title, now have a maximum height of 450px and a maximum width based on the width of the Message List
    * Image Viewer now shows a loading indicator
    * Fixes rendering/scaling of images for IE11; note that this uses background-image and hides the `<img />` tag so this may impact CSS used if you support IE11
* File Message
    * File Message maximum width is reduced
* Message Type Model Changes
    * Adds `presend()` method that will generate a message and call `message.presend()` so that users may preview it in their Message List without having sent it yet.
    * Supports concept of Slots for organizing Message Metadata (optional -- for use in designing Custom Messages)
* Response Message Changes (WEB-1766)
    * Adds `getOperationsForState(stateName)` to get the list of operations to be sent (or already sent) to the server
    * Adds `getStateChanges()` which returns the Change Events associated with the operations to be sent to the server.
    * Adds `getResponseSummary()` to get the Response Summary instance that this Resonse Message is being sent/was sent to update.
* Changes to the Message Viewer Component (`<layer-message-viewer />`)
    * Adds a `size` property that can be set to `large` for the Large version of a given Message (not supported for all Message Types yet)
    * Removes the `widthType` property; see instead the `width` property which lets a Message Type View force the Message Viewer Width to a fixed pixel value.
    * Removes the `preferredMaxWidth` and `preferredMinWidth` properties
* The Standard Message View Container (`<layer-standard-message-view-container />`) now supports inserting controls via `container.customControls = nodes`
    * This is used by Link Message and Location Message to insert an arrow indicating the message can be clicked
    * This is used by the Audio Message to insert a Play button
* The Message View Mixin used to implement all Custom Messages:
    * Changes to how Message sizes are controlled adding `height`, `width`, `maxWidth` and `minWidth` properties
    * now only calls `onAfterCreate` after the root part of the message has loaded
        * Calls to `onAfterCreate` are blocked if the Root Message Part is > 2KB and still being asynchronously fetched
        * Call to `onAfterCreate` will be called after fetch is completed
    * Now provides `getMaxMessageWidth()` method for getting the available width for the Message to render in
* Component base class now supports properties where `type: Object` is part of the definition; will deserialize JSON property values.
* WEB-1779: Now throws error if calling `Layer.UI.setupMixins({...})` after calling `Layer.init()`
* Increases priority of DOM nodes with `layer-replaceable-name="foo"` within your HTML over `widget.replaceableContent = {foo: nodes}` within your Javascript
* `message-type-response-summmary-v2` renamed to `message-type-response-summary-v2`
* `message-type-response-summmary-v1` renamed to `message-type-response-summary-v1`; Most projects should not be using this!
* Supported Image Types, Audio Types and Video Types can be set in the `settings` via `Layer.init({imageMIMETypes: ['image/gif'], audioMIMETypes: ['audio/mp3'], videoMIMETypes: ['video/mp4']})`; but the default values indicate values that Layer Messages have been tested against.
* File Upload Button can now reslect the same file twice in a row
* The Conversation View now provides a `width` property is set whenever the window resizes; apps may need to set this if they use sliders or other internal size changes.  Changes in this property are used to notify the Conversation View and Message List that they have resized and may need to adjust margins and whether avatars are showing.
* WEB-1792: Adds Replaceable Content section named `conversationViewTop` to the top of the Conversation View; this can be used to render temporary or persisted content on top of the Message List
* Fixes bug where if Conversation is not loaded, Message Status cannot be rendered
* WEB-1620: Adds a prompt to ask users if they want to enable notifications
    * Adds `<layer-prompt />` widget
    * `<layer-notifier />` widget now uses the prompt to ask users if they want to enable notifications
    * If users click Yes, the browser's permissions UI will be presented
    * If users click No, the prompt won't be shown again
    * `Notifier.enableNotificationPrompt` can be set to customize the prompt message
* WEB-1797: Adds MessageTypeModel static `FileBehaviorsForProperty()` method for setting up properties that manage files/blobs
* WEB-1781: Improved link and address detection
    * Detects and links `mailto:` and `tel:` URIs
    * Detects and links email addresses within messages even if not preceded by a `mailto:`
* WEB-1752: `Layer.UI.components.Avatar` Component now accepts `avatarComponent.item = identity;` as another option for setting the Avatar's Identity
* WEB-1707 : Use `Layer.Utils.getLogs()` to get logs to dump to a logging service
    * Use `Layer.init({ logSize: 500 })` to change the number of lines of logging data that is tracked
* Updated babel settings, updated build process
* Fixes line wrapping of text messages in Firefox
* Fixes URL detection to handle multi-line expressions that contain a URL that goes from the start to the end of a line
* Removes all CommonJS module usage from internal components; note that CommonJS is still used when doing `import '@layerhq/web-xdk'`; this will be treated as a potential breaking; changing the main import to use ES6 module exports will happen in the next Major release.
* Removes all SVG background images, and adds SVG as stylable DOM nodes wherever they are used in the UI
    * All Message Views that show icons in their title bars should now provide `getIcon()` method to get an SVG image, rather than `getIconClass()` method which got a CSS class to drive background images (`getIconClass()` should continue to be supported for now)
    * `<layer-titled-message-view-container />` property `icon` renamed to `iconClass`
    * Dialog Close Button will now render differently and CSS may need to be updated
    * File Upload Button will now render differently and CSS may need to be updated

## 4.0.4

* WEB-1796: Fixes Image Orientation for rotated images sent via Safari
* WEB-1785: Rendering of Unused Product Choices Fixed

## 4.0.3

* Fixes identity metadata so that it is always an Object even when there is no value in the object
* Adds Property Type for UI Components of `type: Object`
* `replaceableContent` can now be set as an attribute and will be converted to Object.
* WEB-1765: Adds `presend()` method to all Message Type Models so that messages created from Models can be previewed in the Message List.
* Fixes rendering of Date Sent for messages that were `presend()` before they were `send()`
* Backwards compatability for the Preview Release Choice Messages which used `questions` instead of `label`
* Refactors imports for Messaging Models/Components into `src/ui/messages/index` and `src/ui/messages/index-lite`
  (for internal use)
* WEB-1772: No longer pings to check if server is available unless client is ready and authenticated
* WEB-1763: No longer requires all imports follow the same path; one component may import `@layerhq/webxdk` and another  `@layerhq/webxdk/index-lite` without generating conflicts or duplication
* WEB-1762: Use passive scroll listeners
* WEB-1783: text/plain and legacy messages from Layer UI/Atlas now render in the Conversation List

## 4.0.2

* Adds logging mode for doing timing; `Layer.init({ appId, logLevel: Layer.Constants.LOG.TIMING })`
* Changes message-type-response-summary `reset()` to not unregister registered states
* Adds better validation of `localStorage` before using it
* WEB-1755: Refactors Emoji Support:
    * The Emoji text processor no longer parses for `:smile:` and `:-)`; it is now used solely for those wanting Twemoji's standard emojis
      that work cross platform and provides consistent emojis across all platforms. This continues to be an optional part of the build; included
      for those who use `import '@layerhq/web-xdk'` and left out for those who do  `import '@layerhq/web-xdk/index-lite'`.
    * The Compose Bar now detects `:smile:` and `:-)` and translates them into Emoji characters that can be understood by Android and iOS native apps.  This is currently handled via [remarkable-emoji](https://www.npmjs.com/package/remarkable-emoji).
* Adds CONTRIBUTING.md guidelines for submitting PRs to this repository.
* WEB-1756: Google Maps API Key is now an input to `Layer.init({ appId, googleMapsKey: 'my-key' })`;
  without this, Location Messages will not work. Previously there was an undocumented hack to make this work.
* WEB-1757: isCurrentParticipant is now recalculated any time the participant list changes, and triggers change events when its value changes
* Replaceable Content:
    * on searching child nodes now ignores Text Nodes
    * now correctly finds `layer-replaceable-name` in browsers that require the Webcomponents Polyfill.
        * Thanks to [matthieusieben](https://github.com/matthieusieben) for identifying and fixing this.
* Tweak to button height styling prevents raw JS sample app from having unexpected Button Heights

## 4.0.1

* WEB-1731: Adds AltMIMETypes
    * A Model can represent more than one MIME Type
    * A Model can represent the same MIME Type but with different
      version numbers in the version string
* WEB-1731: Adds versioning for the Response Summary class
* Fixes Toast Notification CSS to prevent overflow

## 4.0.0

*Breaking Changes*

* WEB-1421: Client now throws errors if a `challenge` event is not registered.  All apps should register this event even if only to handle reauthentication
* Custom Messages using the Titled Message View Container must now provide views with `getTitle()` and `getIconClass()` methods rather than `_getTitle()` and `_getIconClass()` methods.
* CRDT data structures replacing old Response Message datastructures.
* Custom Messages must now register any state shared via Response Messages
* Receipt Message has renamed Message Parts with Product Information from `product-items` to `product-item`
* `enabledFor` is a required property on all Choice Models

All Changes:

* WEB-1631: `Layer.Core.Message.deliveryStatus` and `Layer.Core.Message.readStatus` now more correctly handles case where `Layer.Core.Conversation` is still loading
  from the server.
* WEB-1421: Client now throws errors if a `challenge` event is not registered.  All apps should register this event even if only to handle reauthentication
* WEB-1198: Filters out invalid Identities from `createConversation` and `addParticipants`
* WEB-1619: Adds Anonymous avatar and group avatar graphics
* WEB-1247: Handles scenario where External Content is being accessed prior to it having been created
* WEB-1574: Now triggers `move` events and rerenders UI when adding Conversation Query results to individually fetched Conversations
* If `isPersistenceEnabled` is used, but no `import @layerhq/core/db-manager` then an error is thrown
* WEB-1267: Now correctly writes Receipt Requests to `indexedDB` and loads them on reloading the app (if `isPersistenceEnabled` is `true`)
* Small adjustments to positioning of Conversation List Item's `<layer-menu-button />`
* The FileUploadButton component now supports `onFilesSelected` and `onModelsGenerated` as properties that can be assigned event handler functions
* Setting `messageViewer.messageViewContainerTagName = null` prior to `onAfterCreate` now correctly skips the use of any Message View Container
  for a Custom Message Type (for use in managing sub-message-viewers).
* Titled Message View Container now expects the Message Type View to provide `getTitle()` and `getIconClass()` methods rather than `_getTitle()` and `_getIconClass()` methods.
* Fixes `model.source` for the File Message Type Model to refer to a `Layer.Core.MessagePart`
* Message Type Models now trigger a `message-type-model:has-new-message` event when a locally generated model gets its Message
* Message event `messages:sending` can now have `evt.cancel()` called on them to prevent the Message from being sent.
* APIs and usage around Response Messages has changed; most developers do not directly create nor interact with these;
  so consult docs if this is likely to impact you.
* `layer-choice-model-generate-response-message` event is removed
* `message-type-model:customization` event is still present for custom models, but no longer used
* `message-type-model:change` events now correctly use `property` rather than `propertyName` in the change report.
* `message-type-model:sending-response-message` event now lets apps customize Response Messages or prevent them from being sent
* Custom Message Types now have the following additional life cycle methods:
    * registerAllStates: Function for registering any states sent/received via Response Messages by this MessageType.
    * initializeNewModel: Called durinacg initialization on any Message Type Model that is being instantiated from locally generated properties, and not from a Message
    * initializeAnonymousModel: Called during initalization on any Message Type Model that is "anonymous" (i.e. it has a Message, but no MessagePart from which it gets its data and responses)
* WEB-1735, WEB-1733: Provides a build using `import '@layerhq/web-xdk/index-lite'`
    * Build comes without Webcomponents polyfil
    * Build comes without emoji libraries
    * Build comes without the ConversationView being a file drop target for sending attachments
    * Build comes without the ConversationView detecting keystrokes and refocusing on the Compose Bar
    * Changes to all builds:
        * Refactors initialization for all Mixins
        * Text Handlers that are missing are ignored and assumed to have been optimized out of the build
        * Mixins within Component definitions may now be Strings naming the Mixin which can be imported later
        * Mixins that lack definitions are ignored and assumed to have been optimized out of the build
* WEB-1742: Removes End of List indicators from Conversation List and Identity List
* WEB-1715: Adjustments to various uses of the color "blue" in the themes
* WEB-1710: `open-file-action` of the File Message now able to open files smaller than 2KB
* WEB-1723: Removes `bottom-border` between items in the Conversation List and Identity List; change `@color-role-list-item-border` in themes to restore or change this.
* WEB-1722: Buttons now use bold font
* WEB-1720: CSS fixes to Button Message corners for Safari
* WEB-1714: Persistence now relies on existing deduplication and no longer removes Sync Requests from IndexedDB to prevent multiple tabs from firing requests
* WEB-1725: DOM structure changes for Conversation Items within the Conversation List
    * CSS changes around all `<layer-menu-button />` components
    * CSS and DOM changes around all Conversation Items
    * Changes to the position and contents of Conversation Item's Replaceable Content (which now includes both the date and menu buttons)
* Deprecates `messageTypeModel.getParentModel()` method; use `messageTypeModel.parentModel` property instead
* WEB-1711: Removes 450px fixed max width for messages; now only for Product Messages
* WEB-1730: Adds `npm` `content-type-parser` package to parse and validate MIME Types (imported as a file rather than npm module due to IE11 babel support needs)
* Fixes initialization of Presence / restoration of Presence
* Removes Menu Buttons from Conversation List and Message List; these can be enabled by setting a function as the `getMenuItem` property on these components

## 1.0.0-pre2.8

*Breaking Changes*

* Message Types were previously intialized using `_parseMessage` and `_generateParts`. These methods have been refactored/renamed; see below.
* WEB-1702: Do not allow `getXXX(id, true)` calls if `!client.isReady`.

Additional Changes:

* WEB-1672: Dialog no longer calls `evt.preventDefault()` on touch events from UI Components inside of the Dialog
* Update default MIME Type from `text/plain` to `application/vnd.layer.text+json`
* WEB-1684: Refactored/redesigned methods for initializing and updating Message Type Models:
    * `model._initializeProperties()` method has been removed. Initialize properties in your constructor.
    * `model._generateParts()` has been renamed to `generateParts()`
    * `model._addModel()` has been renamed to `addChildModel()`
    * `model.addChildPart()` has been added
    * `model._initBodyWithMetadata()` has been renamed to `initBodyWithMetadata()`
    * `model._propertyHasValue()` has been renamed to `propertyHasValue()`
    * `model._parseMessage()` has been renamed to `parseMessage()`
    * `model.parseMessage()/_parseMessage()` has been redefined; you should not be providing one of these in your Message Type Subclass
    * `model.parseModelPart({ payload, isEdit })` has been added to the lifecycle. Provide one of these in your Message Type Subclass; it will be called
        when the Message is first imported into the Model, and recalled any time the model's Message Part is updated
    * `model.parseModelChildParts({ changes, isEdit })` has been added to the lifecycle. Provide one of these in your Message Type Subclass; it will be called
        when the Message is first imported into the Model, and recalled any time new Child Message Parts are added, or are updated.
    * `model.parseModelResponses()` has been added to the lifecycle. Provide one of these if your Message Type Subclass uses Message Responses; it will be called
        when the Messeage is first imported into the Model (if that message has any responses), and recalled any time a Response Message Part is added or updated in the Message.
    * `model._processNewResponses()` has been removed; see `model.parseModelResponses()`
    * `model._mergeAction()` has been renamed to `mergeAction()`
    * `model.responses._parseMessage()` has been renamed to `parseResponsePart()`
    * `model.responses.reset()` has been added to handle cases where the Response Summary Message Part has been deleted
* Removes `/* istanbul ignore next */` from every generated line of code
* WEB-1702: Do not allow `getXXX(id, true)` calls if `!client.isReady`. Applies to `getConversation`, `getMessage`, `getIdentity`, etc...
* Fixes broken code in animated scroller that caused it to leap when it should slide
* WEB-1697: When fewer than a screenful of messages in the message list, latest message is at the bottom of the View, rather than the top
    * BEFORE this change: Last message rendered at the top of the list, and as the Query loads messages, it gets pushed down
    * AFTER this change: Last message rendered at the bottom, and as the Query loads messages, they are rendered above the last message which does not move.
* Minor fixes to Location Message width
* Fixes bug in `Message.toObject()` which failed to handle Sets (Message Parts)


## 1.0.0-pre2.7

*Breaking Changes*

* The `Label` static property has been removed from all Message Type Model classes.

Additional Changes:

* Each Message Type Model now has
    * A static `LabelSingular` property (File, Location, Receipt, Product, etc...). Overwrite this value with customizations.
    * A static `LabelPlural` property (Files, Locations, Receipts, Products, etc...). Overwrite this value with customizations.
    * A static `SummaryTemplate` property that is used to generate a one line summary, and which accepts templated values (`${title}: ${text}`) which accesses the properties of the Model.  Overwrite this value with customizations.
    * A `typeLabel` property that can be referenced in the `SummaryTemplate` property to get ("File", "Location", "Receipt") the name of the message type
    * Models may still provide their own `getOneLineSummary()` method, but should no longer need to do so.
* Identity List now has
    * `metadataRenderer` property for rendering metadata when the `size` property is `large`
    * Support for `size` property to be `large`
* Minified themes `layer-basic-blue.min.css` and `layer-groups.min.css` are now part of the `npm` repo

## 1.0.0-pre2.6

*Breaking Changes*

* Response Messages are now sent with Notifications.  No changes are needed for apps that consider this desirable. Those that do not
  are likely to consider this a breaking change.

Additional Changes:

* Adds eslint to build
* WEB-1686: layer-models-generated event now supports `evt.preventDefault()` to prevent the models from being sent as a Message
* WEB-1660: Builds in default to filter out Messages from the Conversation View Query that are Response Messages that have no displayable content
* WEB-1641: Simplifies and standardizes how Notifications are sent with Messages when working with Message Type Models.
    * `MessageTypeModel` adds a `getNotification()` method which returns a standard/suggested `notification` object for inclusion with `message.send(notification)`
    * `MessageTypeModel.send()` now calls `getNotification()` if a `notification` is not provided, which means that `model.send({ conversation })` will generate a suitable notification for all participants
    * `MessageTypeModel.generateMessage()` is still available but `MessageTypeModel.send()` is not recommended over it unless you need to modify the Message before its sent.
    * `MessageTypeModel.NotificationTitle` property now contains a customizable string to use for the notification `title`; see API Reference for details.
    * The Choice Model now uses `responseModel.send({ conversation })`, which means that Response Messages will now include notifications
    * `client.on('messages:sending')` and `message.on('messages:sending')` can now be used to alter notifications
    * Standardizes/updates how Messages are presented in both Conversation Lists (as Last Message) and in Notifications.
    * Adds the `message-type-model:notification` event for customizing notifications sent for each model "on the fly"
* WEB-1691: Backwards compatability support for Atlas/Layer-UI Image Messages
* WEB-1639: Insure presend + indexedDB work together properly
* Fixes persistence/indexedDB to work with MIME Type Attributes
* Fixes styling of messages that are not yet received by the server to be 50% opaque
* WEB-1671: Expanded Views now get the action data from the button or message that opened them; provided via the `openActionData` property.
* WEB-1696: Link Message is now part of the standard build; import not required.

## 1.0.0-pre2.5

* React Adapter now respects `className` and `style` properties
* Fixes typo in 1.0.0-pre2.4
* Button Message `action.event` and `action.data` are propagated to child models

## 1.0.0-pre2.4

* Error publishing 1.0.0-pre2.3; have republished as 1.0.0-pre2.4.

## 1.0.0-pre2.3

*breaking changes*

* `getMenuOptions` has been renamed to `getMenuItems` in all places it occurs

Additional Changes:

* Automated tests setup with travis + saucelabs
* Removes SystemBus from `root.js`; uses `Layer.Utils.defer` instead
* Memory leaks removed from unit tests
* Upgrade to jasmine 3.0.0
* Refactored tests and CI with Saucelabs
* WEB-1680: `messageStatusRenderer` and `dateRenderer` properties now used on initial load as well as new messages
* WEB-1685: Improves quality and size of Preview Images, and adds static properties to let developers customize preview sizing and quality
* WEB-1648: Replace `MessageTypeModel.responses` object with `MessageTypeModel.responses` a `MessageTypeResponseSummaryModel` instance (i.e. added the `MessageTypeResponseSummaryModel` class)
    * Adds `model.responses.getResponse(responseName, identityId)`
    * Adds `model.responses.getResponses(responseName, identityIds)`
* Redefines the `layer-widget-destroyed` event; it now triggers on `document.body` for each removed component; access `evt.detail.target` not `evt.target` to determine what UI Component has been removed and is about to be destroyed.
* Fixes build script that strips HTML Comments out of templates
* ReplaceableContent subproperties now accept `null` values as a way to prevent anything from being rendered in an area.
* Adds the 'layer-groups.css' theme
* Flexbox workarounds added to the CSS
* Now supports setting `model.action.event = null;` to prevent a model's action from triggering

## 1.0.0-pre2.2

* NPM repo now contains missing theme source files, and not just theme build files
* Removes redundant `messages:change` and `messageparts:change` events on loading external content

## 1.0.0-pre2.1

* Marks npm repo as public rather than private
* Restructures npm repo for more direct access to components and themes

## 1.0.0-pre2.0

### Important Changes

* The MIME Type Attribute `node-id` is no longer used in Message parts. As a result, all Message Response Integrations will need to be redeployed/updated.
* Mixin Names for customizing `<layer-message-item-sent />` `<layer-message-item-received />` and `<layer-message-item-status />` have changed:
    * `messageRowHeader` has been replaced with
        * `messageSentHeader`: Header for messages sent by the current user
        * `messageReceivedHeader`: Header for messages received by the current user
        * `messageStatusHeader`: Header for status messages
    * `messageRowFooter` has been replaced with
        * `messageSentFooter`: Footer for messages sent by the current user
        * `messageReceivedFooter`: Footer for messages received by the current user
        * `messageStatusFooter`: Header for status messages
    * `messageRowRight` has been replaced with
        * `messageSentRight`: Customize area to the right of the messages sent by the current user
        * `messageReceivedRight`: Customize area to the right of the messages received by the current user
        * `messageStatusRight`: Customize area to the right of the status messages
    * `messageRowLeft` has been replaced with
        * `messageSentLeft`: Customize area to the left of the messages sent by the current user
        * `messageReceivedLeft`: Customize area to the left of the messages received by the current user
        * `messageStatusLeft`: Customize area to the left of the status messages
    * Furthermore, Layer.UI.UIUtils.ReplacableSnippets has been added with simple strings that can be used as standard values for the above Replaceable Content fields
* API Reference is now published at https://preview-docs.layer.com/xdk/webxdk/introduction
* `<layer-status-message />` can now be configured with properties without having to completely rewrite the `onRender` method for each customization
* UI Component Lifecycle Changes:
    * `onRerender()` is *always* called after `onRender()`, any calls you make to it from `onRender()` methods are now redundant
    * Root implementations of UI Component lifecycle methods are no longer blocked via `registerComponent.MODES.OVERWRITE`
* `message.parts` is now represented as Set rather than an Array. To simplify working with the javascript Set object, `Layer.Core.Message` provides the following methods:
    * `filterParts`: Standard filter returns an array of matching parts
    * `mapParts`: Standard map returns an array from the set
    * `findPart`: Finds a single part matching the callback
    * `getRootPart`: Returns the Root Message Part (main part)
    * `getPartsMatchingAttribute`: Searches parts for one with the specified MIME Type attributes
* Response Messages now contain only a Status Message Type Model, and no longer can contain a Text Message Type Model
* Image Message sizing is tweaked
* Image Messages now use `<img />` not `<canvas />`

### Build Breaking Changes

* Using `npm` to `import` no longer imports all Message Type Models, nor all UI Components. Import only those UI Components you require (they will import their dependencies).  Example:
    * `import '@layerhq/web-xdk/ui/adapters/react';`
    * `import '@layerhq/web-xdk/ui/messages/status/layer-status-message-view';`
    * `import '@layerhq/web-xdk/ui/messages/receipt/layer-receipt-message-view';`
    * `import '@layerhq/web-xdk/ui/components/layer-avatar';`
* Using Persistence requires you to import the db-manager: `import '@layerhq/web-xdk/core/db-manager';`

### New Features and utilities

* Adds `multiple` property to FileUploadWidget
* Message Type Model now has a `getParticipantResponse()` method for extracting participant responses to a Model.
* Adds `message.createModel()` to get the Message Type Model representing the `Layer.Core.Message` instance
* Adds `part.createModel()` to get the Message Type Model representing the `Layer.Core.MessagePart` instance
* Adds `message.getRootPart()` to get the root MessagePart for the Message
* Adds `model.getParentModel()` to get the Parent Model of the current Model (or `null` if its already the root model)

### Misc Changes (some may be breaking)

* Fixes bug in rendering of a carousel of images when generated by FileUploadWidget
* `Layer.Core.Query.ConversationQuery`  renamed to `Layer.Core.Query.ConversationsQuery`
* `Layer.Core.Query.ConversationQuery` and other queries can now be explicitly accessed to modify the `MaxPageSize` static property
* Renamed ReceiptModel property  `shippingAddressModel` => `shippingAddress` and `billingAddressModel` => `billingAddress`
* Renamed:
    * `<layer-standard-display-container />` to `<layer-standard-message-view-container />`
    * `<layer-titled-display-container />` to `<layer-titled-message-view-container />`
    * All Message Types are renamed with the following pattern: `<layer-xxx-view />` to `<layer-xxx-message-view />`
    * Removed support for putting a `selectedAnswer` in the constructor for a Choice Model.  Instead use the `preselectedChoice` property.
* Registered Message Action handlers are no longer called with `<layer-message-viewer />` as context, and instead receive inputs of `({data, model, rootModel, messageViewer})` where model and rootModel represent the model the event was triggered upon and any root Message Model (Carousel for example) that contains the model.
* Triggering an action now first triggers a DOM level event with the name of the action. A call to `evt.preventDefault()` will prevent the Registered Message Action Handler from being called, and will let your event handler alone handle it.
* `layer-send-message` event now passes a Layer.Core.MessageTypeModel instead of an array of Layer.Core.MessagePart objects
* `<layer-compose-bar />` has updated its public API around creating/sending messages. Most apps should not be using this, but handy for custom widgets being embedded into the Compose Bar.
* `<layer-file-upload-button />` events have all been redefined
* `<layer-conversation-view />`
    * `onSendMessage` and `layer-send-message` event properties have changed, Message is no longer a property of this event, instead `model` is provided, and `model.message` can be used if Message access is required.
    * `autoFocusConversation` now takes Contstants rather than Strings as inputs
* `layer-composer-change-value` and `onComposerChangeValue` events are now `layer-compose-bar-change-event` and `onComposeBarChangeValue`; `evt.detail.value` is now `evt.detail.newValue`
* `deleteConversationEnabled` has been removed from `<layer-conversation-list />` and `<layer-conversation-item />`
* `<layer-conversation-list />` `sortBy` property now requires values of `Layer.UI.Constants.CONVERSATIONS_SORT.LAST_MESSAGE` or `Layer.UI.Constants.CONVERSATIONS_SORT.CREATED_AT`; prior values are no longer valid
* `<layer-identity-item />` property `selected` renamed to `isSelected`
* Choice Model now has a `selectedChoice` property (Readonly, single-select only) to get the Choice object that is currently selected
* Message Type Models no longer emit a `change` event, and now intsead emit a `message-type-model:change` event.
* Message Type Models now emit a `message-type-model:customization` event to allow for customization of behaviors
* Layer.Core.LayerEvent (i.e. any event triggered by non-UI-components) now supports
  * `evt.preventDefault()`: Can be called on any event where `evt.cancelable` is `true` to prevent a default behavior (very few uses of this at the moment)
  * `evt.returnValue()`: Can be called on any event that is providing an opportunity for you to provide an alternate value for it to use.  Currently used by some `message-type-model:customization` events
* Layer.UI.Menu `options` property is now an `items` property
* CSS Class `layer-root-card` renamed to `layer-root-viewer`
* Twemoji emojis can be disabled using `Layer.init({useEmojiImages: false})`
* List Item no longer provide an `addClass` `removeClass` and `toggleClass` method (`toggleClass` is now a part of all UI Components)
* `Layer.UI.registerMessageComponent` is removed, use `Layer.UI.registerComponent` followed by `Layer.UI.handlers.message.register` instead. Note that use of this technique is deprecated.
* `Layer.UI.registerMessageHandlers` moved to `Layer.UI.handlers.message.register`
* `Layer.UI.registerTextHandler` moved to `Layer.UI.handlers.text.register`
* `Layer.UI.isInBackground` moved to `Layer.UI.Utils.isInBackground`
* `Layer.UI.showFullScreen` moved to `Layer.UI.Utils.showFullScreen`
* `Layer.UI.createItemSeparator` moved to `Layer.UI.UIUtils.createItemSeparator`
* `Layer.UI.addAdapter` moved to `Layer.UI.adapters.register`
* `Layer.UI.registerMessageActionHandler` moved to `Layer.UI.MessageActions.register`
* `Layer.Core.Message.getText()` is removed
* `<layer-message-viewer />` `setupMessage()` method is now `_setupMessage()`
* `Layer.Util` moved to `Layer.Utils`; folder paths similarly changed.
* `Layer.UI.animatedScrollTo` and `Layer.UI.animatedScrollLeftTo` moved to `Layer.UI.UIUtils`
* Everything in `Layer.UI.utils` renamed to `Layer.UI.UIUtils`
* `Layer.UI.UIUtils.registerStatusModel(ModelClass)` is now used to register a Message as a Status Message rather than `Layer.UI.statusMimeTypes.push(mimeType)`
* `Layer.Core.MessageTypeModel` now has a `getModelsByRole` method, and no longer `getModelsForPart` and `getModelForPart` methods
* `Layer.Core.MessageTypeModel` now has a `childModels` property with all Child Models initialized automatically.
* `Layer.Core.Identity.sessionOwner` has been renamed to `Layer.Core.Identity.isMine`. Most common use of this: `message.sender.isMine` tells you if the sender of the message is the user of this client.
* `<layer-choice-button />` and `<layer-choice-message-view />` both provide `onChoiceSelect` which lets Mixins customize selection behavior

## 1.0.0-pre1.16

* Fixes handling of react adaptor on receiving empty values

## 1.0.0-pre1.15

1. Adds a Feedback Message Type
2. Adds an Expanded Message Viewer/dialog
3. Adds better test for Message Part to see if its < 2KB
4. Adds a destroy method to all UI Components that can be called to destroy a Components
5. `<layer-conversation-view />` Now has a `layer-conversation-panel-change` event
6. Adds sample app code for making app fit and titles/composer not slide out of view
7. General Cleanup

## 1.0.0-pre1.14

* Fixes bug in Message Grouping where Status Messages are treated as part of the grouping
* Adds a `filter` callback to `Layer.Core.Query` and a `queryFilter` property to the `ConversationView`:

```
render() {
  return <ConversationView
    queryFilter={(message) => return isAcceptableMessage(message)} />
}
```

## 1.0.0-pre1.13

* Adds Message Tests for all message types
* Adds `customResponseData` per choice item for the Choice Model (experimental/risky feature)

## 1.0.0-pre1.11

* Adds `Layer.UI.statusMimeTypes.push(MyCustomModel.MIMEType)` as the way to register a Message Type to be rendered as a Status Message instead of a Sent or Received Message.

## 1.0.0-pre1.10

* Adds `<layer-conversation-item-date />` added to simplify Conversation Item Date customizations

## 1.0.0-pre1.9

* Adds `enabledFor` to Choice Model
* Some refactoring of enabled detection for Choice Models
* Adds CSS class name`layer-message-item-${Message View Class Name}` to the `<layer-message-item-sent />`, `<layer-message-item-received />` and `<layer-message-item-status />` elements; `layer-message-item-layer-text-view`

## 1.0.0-pre1.8

* Adds a Status Message Type
* Adds a `Layer.UI.statusMimeTypes` array of mime types that are treated as Status Messages

## 1.0.0-pre1.7

* Test Framework
* Bug fixes
* React Sample App

## 1.0.0-pre1.6

* Fixes `nodeId` property which was missing from the prototype, and breaking attempts to set `parentNodeId`

## 1.0.0-pre1.5

* Updates React adapter's getInitialProps method to work with new class definitions
* Updates reauthentication to not reauthenticate based on no-longer-used session tokens

## 1.0.0-pre1.4

* Fixes error in static client property `QUERIED_CACHE_PURGE_INTERVAL` which should have been `CACHE_PURGE_INTERVAL`, causing new messages to be instantly destroyed

## 1.0.0-pre1.3

* Updates React adapter for React 16
* Removes old nodejs support code; runs in browser only for now

## 1.0.0-pre1.2

* Fixes package.json `main`
* Fixes folder references

## 1.0.0-pre1.1

* Prerelease of the Web XDK merges the WebSDK and Layer UI for Web into a single project and evolves the concept of Messaging Experiences beyond slapping a message onto a page.
