/**
 * Represents a single Choice among many Choices within the Layer.UI.messages.ChoiceMessageModel model.
 *
 * ### Importing
 *
 * Not included with the standard build. Import using:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/choice/layer-choice-message-view';
 * ```
 *
 * @class Layer.UI.messages.ChoiceMessageItemModel
 * @extends Layer.Core.Root
 */

import { Root } from '../../../core/namespace';

class ChoiceItem extends Root {
  constructor(options) {
    if (options.custom_response_data) {
      options.customResponseData = options.custom_response_data;
      delete options.custom_response_data;
    }
    super(options);
  }
  getSelectedText() {
    if (this.states && this.states.selected && this.states.selected.text) {
      return this.states.selected.text;
    } else {
      return this.text;
    }
  }
  getDefaultText() {
    if (this.states && this.states.default && this.states.default.text) {
      return this.states.default.text;
    } else {
      return this.text;
    }
  }
  getSelectedTooltip() {
    if (this.states && this.states.selected && this.states.selected.tooltip) {
      return this.states.selected.tooltip;
    } else {
      return this.tooltip;
    }
  }
  getDefaultTooltip() {
    if (this.states && this.states.default && this.states.default.tooltip) {
      return this.states.default.tooltip;
    } else {
      return this.tooltip;
    }
  }

  toSnakeCase() {
    const obj = {};
    obj.id = this.id;
    if (this.text) obj.text = this.text;
    if (this.tooltip) obj.tooltip = this.tooltip;
    if (this.states) obj.states = this.states;
    if (this.customResponseData) obj.custom_response_data = this.customResponseData;
    return obj;
  }
}

ChoiceItem.prototype.text = '';
ChoiceItem.prototype.tooltip = '';
ChoiceItem.prototype.id = '';
ChoiceItem.prototype.states = null;
ChoiceItem.prototype.customResponseData = null;

Root.initClass.apply(ChoiceItem, [ChoiceItem, 'ChoiceItem']);
module.exports = ChoiceItem;
