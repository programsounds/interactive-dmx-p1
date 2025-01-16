var IO_DICT_ID = jsarguments[1];
var DEVICES_DICT_ID = jsarguments[2];

var ioDict = new Dict(IO_DICT_ID);
var ioObj = {};

var devicesDict = new Dict(DEVICES_DICT_ID);
var devicesObj = {};

function loadIoDict() {
  ioObj = JSON.parse(ioDict.stringify());
}

function loadDevicesDict() {
  devicesObj = JSON.parse(devicesDict.stringify());
}

var TARGET_PATCHER = this.patcher;

/* GUI dimensions */

var ROW_WIDTH = 525;
var ROW_HEIGHT = 23;
var BODY_MARGIN_TOP = 0;
var BODY_MARGIN_LEFT = 0;
var INSPECTOR_WIDTH = 229;
var INSPECTOR_HEIGHT = 400;
var TOTAL_WIDTH = 775;
var TOTAL_HEIGHT = 465;

/* IO devices dropdown */

function CreateIoDevicesList(type) {
  loadDevicesDict();
  var devices = devicesObj.io_devices;
  if (!devices) return;

  var ioDevicesList = [];
  for (var i = 0; i < devices.length; i++) {
    if (devices[i].type === type) {
      ioDevicesList.push(devices[i]);
    }
  }

  return ioDevicesList;
}

function populateUSBDevicesDropdown() {
  var dropdown = this.patcher.getnamed("usbDevicesMenu");
  dropdown.clear();
  dropdown.append("(Select Device)");

  var vendorIdDropdown = this.patcher.getnamed("usbDevicesVendorIdMenu");
  vendorIdDropdown.clear();
  vendorIdDropdown.append("(vendorId)");

  var productIdDropdown = this.patcher.getnamed("usbDevicesProductIdMenu");
  productIdDropdown.clear();
  productIdDropdown.append("(productId)");

  var ioDevicesList = CreateIoDevicesList("USB");
  for (var i = 0; i < ioDevicesList.length; i++) {
    dropdown.append(ioDevicesList[i].name);
    vendorIdDropdown.append(ioDevicesList[i].vendorId);
    productIdDropdown.append(ioDevicesList[i].productId);
  }
}

function populateNodesDropdown() {
  var dropdown = this.patcher.getnamed("nodesMenu");
  dropdown.clear();
  dropdown.append("(Select Device)");

  var ioDevicesList = CreateIoDevicesList("ArtNetNode");
  for (var i = 0; i < ioDevicesList.length; i++) {
    dropdown.append(ioDevicesList[i].name);
  }
}
function populatePeersDropdown() {
  var dropdown = this.patcher.getnamed("peersMenu");
  dropdown.clear();
  dropdown.append("(Select Peer)");
  dropdown.append("any");

  var ioDevicesList = CreateIoDevicesList("CITP");
  for (var i = 0; i < ioDevicesList.length; i++) {
    dropdown.append(ioDevicesList[i].name);
  }
}

/* IO list */

function createIoListItemInputsTitle(gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.InputsTitle"
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemOutputsTitle(gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.OutputsTitle"
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemArtNetInput(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.ArtNetInput",
    "@args",
    IO_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "0" + "::" + data.index
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemArtNetOutput(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.ArtNetOutput",
    "@args",
    IO_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemArtNetNodeOutput(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.ArtNetNodeOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemUSBOutput(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.USBOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createIoListItemCITPOutput(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOListItem.CITPOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

var currentIoListItems = [];
function createIoListTable() {
  loadIoDict();
  var inputs = ioObj.inputs;
  if (!inputs) return;
  var outputs = ioObj.outputs;
  if (!outputs) return;

  for (var i = 0; i < currentIoListItems.length; i++) {
    TARGET_PATCHER.remove(currentIoListItems[i]);
  }

  var listItemIndex = 0;
  var gui = {
    targetPatcher: TARGET_PATCHER,
    positionX: BODY_MARGIN_LEFT,
    positionY: listItemIndex * ROW_HEIGHT + BODY_MARGIN_TOP,
    width: ROW_WIDTH,
    height: ROW_HEIGHT,
  };

  if (inputs.length > 0) {
    currentIoListItems.push(createIoListItemInputsTitle(gui));
    listItemIndex++;
  }

  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];

    var data = {
      index: i
    };
    gui.positionY = listItemIndex * ROW_HEIGHT + BODY_MARGIN_TOP;
  
    var item;
    switch (input.type) {
      case "ArtNetInput":
        item = createIoListItemArtNetInput(data, gui);
        break;
      default:
        break;
    }
    if (!item) continue;

    currentIoListItems.push(item);
    listItemIndex++;
  }

  if (outputs.length > 0) {
    gui.positionY = listItemIndex * ROW_HEIGHT + BODY_MARGIN_TOP;
    currentIoListItems.push(createIoListItemOutputsTitle(gui));
    listItemIndex++;
  }

  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i];

    var data = {
      index: i
    };
    gui.positionY = listItemIndex * ROW_HEIGHT + BODY_MARGIN_TOP;

    var item;
    switch (output.type) {
      case "artNet":
        item = createIoListItemArtNetOutput(data, gui);
        break;
      case "ArtNetNode":
        item = createIoListItemArtNetNodeOutput(data, gui);
        break;
      case "USB":
        item = createIoListItemUSBOutput(data, gui);
        break;
      case "CITP":
        item = createIoListItemCITPOutput(data, gui);
        break;
      default:
        break;
    }
    if (!item) continue;

    currentIoListItems.push(item);
    listItemIndex++;
  }
}

/* IO inspector */

function createIoInspectorArtNetInput(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOInspector.ArtNetInput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "0" + "::" + data.index
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createIoInspectorArtNetOutput(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOInspector.ArtNetOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createIoInspectorArtNetNodeOutput(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOInspector.ArtNetNodeOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createIoInspectorUSBOutput(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOInspector.USBOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createIoInspectorCITPOutput(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.IOInspector.CITPOutput",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID,
    data.index,
    "@varname",
    "ioItem" + "1" + "::" + data.index
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

var currentIoInspectorElements = [];
function createIoInspector(inputOrOutput, index) {
  loadIoDict();
  var inputs = ioObj.inputs;
  if (!inputs) return;
  var outputs = ioObj.outputs;
  if (!outputs) return;

  for (var i = 0; i < currentIoInspectorElements.length; i++) {
    TARGET_PATCHER.remove(currentIoInspectorElements[i]);
  }

  var data = {
    index: index
  };
  var gui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: 0,
    width: INSPECTOR_WIDTH,
    height: INSPECTOR_HEIGHT,
  };

  var type;
  if (inputOrOutput === "input") {
    type = inputs[index].type;
  } else if (inputOrOutput === "output") {
    type = outputs[index].type;
  }

  switch (type) {
    case "ArtNetInput":
      currentIoInspectorElements.push(createIoInspectorArtNetInput(data, gui));
      break;
    case "artNet":
      currentIoInspectorElements.push(createIoInspectorArtNetOutput(data, gui));
      break;
    case "ArtNetNode":
      currentIoInspectorElements.push(createIoInspectorArtNetNodeOutput(data, gui));
      break;
    case "USB":
      currentIoInspectorElements.push(createIoInspectorUSBOutput(data, gui));
      break;
    case "CITP":
      currentIoInspectorElements.push(createIoInspectorCITPOutput(data, gui));
      break;
    default:
      break;
  }
}

function deselectIoInspector() {
  for (var i = 0; i < currentIoInspectorElements.length; i++) {
    TARGET_PATCHER.remove(currentIoInspectorElements[i]);
  }
}

/* IO creator modal */

function createIoCreatorOverlay(gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.ioeditor.CreatorOverlay",
    "@args",
    IO_DICT_ID,
    DEVICES_DICT_ID
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

var ioCreator;
function createIoCreator() {
  var gui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: 0,
    width: TOTAL_WIDTH,
    height: TOTAL_HEIGHT,
  };

  ioCreator = createIoCreatorOverlay(gui);
  TARGET_PATCHER.bringtofront(ioCreator);
}

function removeIoCreator() {
  TARGET_PATCHER.remove(ioCreator);
}

/* Parent bpatcher */

function resizeParentBpatcher() {
	this.patcher.box.varname = "bp_" + Math.random()*10000;
	this.patcher.parentpatcher.message("script", "sendbox", this.patcher.box.varname, "patching_size", 776, 467);
	this.patcher.box.varname = "";
}