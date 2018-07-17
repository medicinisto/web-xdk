/**
 * TODO: Location Model should be able to use one of these
 * @ignore
 */

import Core from '../../../core/namespace';

const { MessageTypeModel } = Core;

export default class OrganizationModel extends MessageTypeModel {

  parseModelChildParts() {
    super.parseModelChildParts();
    this.addressModels = this.getModelsByRole('address');
    this.contactModels = this.getModelsByRole('contact');
  }
}

OrganizationModel.prototype.addressModels = null;
OrganizationModel.prototype.contactModels = null;
OrganizationModel.prototype.type = '';

OrganizationModel.MIMEType = 'application/vnd.layer.organization+json';

// Register the Card Model Class with the Client
Core.Client.registerMessageTypeModelClass(OrganizationModel, 'OrganizationModel');
