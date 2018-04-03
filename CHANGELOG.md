# Web XDK Change Log

## 4.0.0

*Breaking Changes*

* WEB-1421: Client now throws errors if a `challenge` event is not registered.  All apps should register this event even if only to handle reauthentication
* Custom Messages using the Titled Message View Container must now provide views with `getTitle()` and `getIconClass()` methods rather than `_getTitle()` and `_getIconClass()` methods.
* CRDT data structures replacing old Response Message datastructures.
* Custom Messages must now register any state shared via Response Messages
* Receipt Message has renamed Message Parts with Product Information from `product-items` to `product-item`

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
