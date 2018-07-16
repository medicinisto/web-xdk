/**
 * TODO: Location Model should be able to use one of these
 * TODO: Look at vcard fields
 * @ignore
 */

import Core from '../../../core/namespace';

const { MessageTypeModel } = Core;

class PersonModel extends MessageTypeModel {

  parseModelChildParts() {
    super.parseModelChildParts();

    this.addressModels = this.getModelsByRole('address');
  }
}

PersonModel.prototype.addressModels = null;
PersonModel.prototype.phone = '';
PersonModel.prototype.email = '';
PersonModel.prototype.name = '';
PersonModel.prototype.jobRole = ''; // Used for Person who is an Employee only, not for customers
PersonModel.prototype.identityId = '';

PersonModel.MIMEType = 'application/vnd.layer.person+json';

// Register the Card Model Class with the Client
Core.Client.registerMessageTypeModelClass(PersonModel, 'PersonModel');

module.exports = PersonModel;
