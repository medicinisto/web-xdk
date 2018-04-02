/* eslint-disable */
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');


new TextModel({text: "Basic Choice"}).send({ conversation: $("layer-conversation-view").conversation });


model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
 }).send({ conversation: $("layer-conversation-view").conversation });

 new TextModel({text: "Name property for a custom response message"}).send({ conversation: $("layer-conversation-view").conversation });


model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
    name: "Airspeed Question",
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

 new TextModel({text: "Custom responseName"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
    enabledFor: Layer.client.user.id,
    label: "What is the airspeed velocity of an unladen swallow?",
    responseName: 'airselection',
    choices: [
       {text:  "Zero, it can not get off the ground!", id: "zero"},
       {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
       {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
     ],
  });
  model.send({ conversation: $("layer-conversation-view").conversation })


new TextModel({text: "Preselected Choice"}).send({ conversation: $("layer-conversation-view").conversation });

ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   preselectedChoice: 'clever bastard',
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })


 new TextModel({text: "Enabled for you but not me"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   label: "What is the airspeed velocity of an unladen swallow?",
   enabledFor: $("layer-conversation-view").conversation.participants.filter(user => user !== Layer.client.user).map(user => user.id)[0],
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

 new TextModel({text: "Enabled for me but not you"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })


 new TextModel({text: "Custom Response Data {\"hey\": \"ho\"}"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   customResponseData: {
     hey: "ho"
   },
   choices: [
      {text:  "Zero, it can not get off the ground!", id: "zero"},
      {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
      {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

 new TextModel({text: "Custom Response Data per Choice (v2 feature)"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "What is the airspeed velocity of an unladen swallow?",
   allowDeselect: true,
   customResponseData: {
     hey: "ho"
   },
   choices: [
      {
        text:  "Zero, it can not get off the ground!",
        id: "zero",
        customResponseData: {
          ho: "hum",
          hi: "there"
        }
      },
      {
        text:  "Are we using Imperial or Metric units?", id: "clever bastard",
        customResponseData: {
          hey: "hum1",
          hi: "there2"
        }
      },
      {
        text:  "What do you mean? African or European swallow?", id: "just a smart ass",
        customResponseData: {
          hey: "hum2",
          hi: "there3"
        }
      },
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

new TextModel({text: "Change text between selected/unselected states (v2 feature)"}).send({ conversation: $("layer-conversation-view").conversation });

 ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "Pick a color",
   responseName: 'color',
   preselectedChoice: 'black',
   allowReselect: true,
   choices: [
      {text:  "red", id: "red"},
      {
        text: "blue",
        id: "blue",
        states: {
          selected: {
            text: "blueish"
          }
        }
      },
      {
        text:  "black",
        id: "black",
        states: {
          default: {
            text: "darkgray"
          }
        }
      },
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
new TextModel({text: "Allow reselect"}).send({ conversation: $("layer-conversation-view").conversation });

ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
 model = new ChoiceModel({
   enabledFor: Layer.client.user.id,
   label: "Pick a color",
   allowReselect: true,
   choices: [
      {text:  "red", id: "red"},
      {text:  "blue", id: "blue"},
      {text:  "black", id: "black"},
    ],
 });
 model.send({ conversation: $("layer-conversation-view").conversation })

 TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
 new TextModel({text: "Allow deselect"}).send({ conversation: $("layer-conversation-view").conversation });

ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new ChoiceModel({
  enabledFor: Layer.client.user.id,
  label: "Pick a color",
  allowDeselect: true,
  choices: [
     {text:  "red", id: "red"},
     {text:  "blue", id: "blue"},
     {text:  "black", id: "black"},
   ],
});
model.send({ conversation: $("layer-conversation-view").conversation })

TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
new TextModel({text: "Allow multiselect"}).send({ conversation: $("layer-conversation-view").conversation });

ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new ChoiceModel({
  enabledFor: Layer.client.user.id,
  label: "Pick a color",
  allowMultiselect: true,
  choices: [
     {text:  "red", id: "red"},
     {text:  "blue", id: "blue"},
     {text:  "black", id: "black"},
   ],
});
model.send({ conversation: $("layer-conversation-view").conversation })

TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
new TextModel({text: "Allow reselect with preselected choice"}).send({ conversation: $("layer-conversation-view").conversation });
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new ChoiceModel({
  enabledFor: Layer.client.user.id,
  label: "Pick a color",
  allowReselect: true,
  choices: [
     {text:  "red", id: "red"},
     {text:  "blue", id: "blue"},
     {text:  "black", id: "black"},
   ],
   preselectedChoice: "blue"
});
model.send({ conversation: $("layer-conversation-view").conversation })


TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
new TextModel({text: "Allow multiselect with preselected choice"}).send({ conversation: $("layer-conversation-view").conversation });
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
model = new ChoiceModel({
  enabledFor: Layer.client.user.id,
  label: "Pick a color",
  allowMultiselect: true,
  choices: [
     {text:  "red", id: "red"},
     {text:  "blue", id: "blue"},
     {text:  "black", id: "black"},
   ],
   preselectedChoice: "blue,red"
});
model.send({ conversation: $("layer-conversation-view").conversation })


TextModel = Layer.Core.Client.getMessageTypeModelClass('TextModel');
new TextModel({text: "Carousel of Choices"}).send({ conversation: $("layer-conversation-view").conversation });
ChoiceModel = Layer.Core.Client.getMessageTypeModelClass('ChoiceModel')
var CarouselModel = Layer.Core.Client.getMessageTypeModelClass('CarouselModel');

model = new CarouselModel({
  items: [
    new ChoiceModel({
      enabledFor: Layer.client.user.id,
        label: "single select without initial state",
        choices: [
          {text:  "red", id: "red"},
          {text:  "blue", id: "blue"},
          {text:  "black", id: "black"},
        ],
    }),
    new ChoiceModel({
      enabledFor: Layer.client.user.id,
        label: "single select with initial state",
        choices: [
          {text:  "red", id: "red"},
          {text:  "blue", id: "blue"},
          {text:  "black", id: "black"},
        ],
        preselectedChoice: "red"
    }),
    new ChoiceModel({
      enabledFor: Layer.client.user.id,
        label: "single reselect with initial state",
        choices: [
          {text:  "red", id: "red"},
          {text:  "blue", id: "blue"},
          {text:  "black", id: "black"},
        ],
        allowReselect: true,
        preselectedChoice: "blue"
    }),
    new ChoiceModel({
      enabledFor: Layer.client.user.id,
        label: "single deselect with initial state",
        choices: [
          {text:  "red", id: "red"},
          {text:  "blue", id: "blue"},
          {text:  "black", id: "black"},
        ],
        allowDeselect: true,
        preselectedChoice: "black"
    }),
    new ChoiceModel({
      enabledFor: Layer.client.user.id,
        label: "Multiselect with initial state",
        choices: [
          {text:  "red", id: "red"},
          {text:  "blue", id: "blue"},
          {text:  "black", id: "black"},
        ],
        allowMultiselect: true,
        preselectedChoice: "blue,black"
    })
  ]
});
model.send({ conversation: $("layer-conversation-view").conversation })
