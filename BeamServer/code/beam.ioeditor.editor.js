autowatch = 1;

var VERSION = 1;
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

function updateDict(targetDict, targetObj) {
  targetDict.parse(JSON.stringify(targetObj));
}

function updatedIoNotification(type, ioIndex) {
  outlet(0, IO_DICT_ID, "ioUpdate", type, ioIndex);
}

function updatedIoListNotification() {
  outlet(0, IO_DICT_ID, "ioListUpdate");
}

function removedIoNotification() {
  outlet(0, IO_DICT_ID, "removedIo");
}

function initIo() {
  loadIoDict();

  if (!ioObj.hasOwnProperty("inputs")) {
    ioObj.inputs = [];
  }
  if (!ioObj.hasOwnProperty("outputs")) {
    ioObj.outputs = [];
  }

  updateDict(ioDict, ioObj);
}

function newIo() {
  loadIoDict();

  ioObj.inputs = [];
  ioObj.outputs = [];

  updateDict(ioDict, ioObj);
  updatedIoListNotification();
}

function USBDeviceWithIdentifier(identifier, devices) {
  for (var i = 0; i < devices.length; i++) {
    var device = devices[i];
    if (device.type !== "USB") continue;
    if (device.name !== identifier.name) continue;
    if (device.vendorId !== identifier.vendorId) continue;
    if (device.productId !== identifier.productId) continue;

    return device;
  }
  return;
}

function ArtNetNodeWithName(name, devices) {
  for (var i = 0; i < devices.length; i++) {
    var device = devices[i];
    if (device.type !== "ArtNetNode") continue;
    if (device.name !== name) continue;
    return device;
  }
  return;
}

function CITPPeerWithName(name, devices) {
  for (var i = 0; i < devices.length; i++) {
    var device = devices[i];
    if (device.type !== "CITP") continue;
    if (device.name !== name) continue;
    return device;
  }
  return;
}

function isArtNetNodeAvailable(name) {
  loadDevicesDict();
  var devices = devicesObj.io_devices;
  if (!devices) return;

  var status = 0;
  if (ArtNetNodeWithName(name, devices)) {
    status = 1;
  }

  outlet(0, status);
}

function isUSBDeviceAvailable(name, vendorId, productId) {
  loadDevicesDict();
  var devices = devicesObj.io_devices;
  if (!devices) return;

  var identifier = {
    name: name,
    vendorId: vendorId,
    productId: productId
  };

  var status = 0;
  if (USBDeviceWithIdentifier(identifier, devices)) {
    status = 1;
  }

  outlet(0, status);
}

function isCITPPeerAvailable(name) {
  if (name == "any") {
    status = 2;
  } else {
    loadDevicesDict();
    var devices = devicesObj.io_devices;
    if (!devices) return;
  
    var status = 0;
    if (CITPPeerWithName(name, devices)) {
      status = 1;
    }
  }

  outlet(0, status);
}

function CreateArtNetInput(sourceUniverse, targetUniverse) {
  return {
    type: "ArtNetInput",
    name: "ArtNetInput",
    sourceUniverse: sourceUniverse,
    targetUniverse: targetUniverse
  };
}

function CreateArtNetOutput(address, sourceUniverse, targetUniverse) {
  return {
    type: "artNet",
    name: "ArtNet",
    address: address,
    sourceUniverse: sourceUniverse,
    targetUniverse: targetUniverse
  };
}

function CreateArtNetNodeOutput(name, sourceUniverse, targetUniverse) {
  return {
    type: "ArtNetNode",
    name: name,
    sourceUniverse: sourceUniverse,
    targetUniverse: targetUniverse
  };
}

function CreateUSBOutput(identifier, sourceUniverse, targetUniverse) {
  return {
    type: "USB",
    name: identifier.name,
    vendorId: identifier.vendorId,
    productId: identifier.productId,
    sourceUniverse: sourceUniverse,
    targetUniverse: targetUniverse
  };
}

function CreateCITPOutput(name, sourceUniverse, targetUniverse) {
  return {
    type: "CITP",
    name: name,
    sourceUniverse: sourceUniverse,
    targetUniverse: targetUniverse
  };
}


function CreateIoItems(amount, data, devices) {
  var ioList = [];

  for (var i = 0; i < amount; i++) {
    var ioItem;

    switch (data.type) {
      case "ArtNetInput":
        ioItem = CreateArtNetInput(
          data.startSourceUniverse + i,
          data.startTargetUniverse + i
        );

        break;
      case "ArtNetOutput":
        ioItem = CreateArtNetOutput(
          data.address,
          data.startSourceUniverse + i,
          data.startTargetUniverse + i
        );

        break;
      case "ArtNetNodeOutput":
        var device = ArtNetNodeWithName(data.name, devices);
        if (device === undefined) {
          return ioList;
        }

        ioItem = CreateArtNetNodeOutput(
          device.name,
          data.startSourceUniverse + i,
          data.startTargetUniverse + i
        );

        break;
      case "USBOutput":
        var device = USBDeviceWithIdentifier(data.identifier, devices);
        if (device === undefined) {
          return ioList;
        }

        ioItem = CreateUSBOutput(
          device,
          data.startSourceUniverse + i,
          data.startTargetUniverse + i
        );

        break;
      default:
        return;
      case "CITPOutput":
        if (data.name == "any") {
          ioItem = CreateCITPOutput(
            "any",
            data.startSourceUniverse + i,
            data.startTargetUniverse + i
          );
        } else {
          var device = CITPPeerWithName(data.name, devices);
          if (device === undefined) {
            return ioList;
          }
  
          ioItem = CreateCITPOutput(
            device.name,
            data.startSourceUniverse + i,
            data.startTargetUniverse + i
          );
        }

        break;
    }

    ioList.push(ioItem);
  }

  return ioList;
}

function addIoItems(amount, type, startSourceUniverse, startTargetUniverse) {
  var data = {
    type: type,
    startSourceUniverse: startSourceUniverse,
    startTargetUniverse: startTargetUniverse
  };

  switch (type) {
    case "ArtNetInput":
      break;
    case "ArtNetOutput":
      data.address = arguments[4];
      break;
    case "ArtNetNodeOutput":
      data.name = arguments[4];
      break;
    case "USBOutput":
      data.identifier = {
        name: arguments[4],
        vendorId: arguments[5],
        productId: arguments[6]
      }
      break;
    case "CITPOutput":
      data.name = arguments[4];
      break;
    default:
      return;
  }

  loadDevicesDict();
  var devices = devicesObj.io_devices;

  var newIoItems = CreateIoItems(
    amount,
    data,
    devices
  );

  initIo();
  loadIoDict();

  switch (type) {
    case "ArtNetInput":
      var inputs = ioObj.inputs;
      if (!inputs) return;

      ioObj.inputs = inputs.concat(newIoItems);
      break;
    case "ArtNetOutput":
    case "ArtNetNodeOutput":
    case "USBOutput":
    case "CITPOutput":
      var outputs = ioObj.outputs;
      if (!outputs) return;
    
      ioObj.outputs = outputs.concat(newIoItems);
      break;
    default:
      return;
  }

  updateDict(ioDict, ioObj);
  updatedIoListNotification();
}

function removeAllIoItems() {
  ioObj.inputs = [];
  ioObj.outputs = [];

  updateDict(ioDict, ioObj);
  removedIoNotification();
}

function removeIoItem(type, index) {
  loadIoDict();

  if (type === "input") {
    var inputs = ioObj.inputs;
    if (!inputs) return;

    var input = inputs[index];
    if (!input) return;

    inputs.splice(index, 1);
  } else if (type === "output") {
    var outputs = ioObj.outputs;
    if (!outputs) return;

    var output = outputs[index];
    if (!output) return;

    outputs.splice(index, 1);
  } else {
    return;
  }

  updateDict(ioDict, ioObj);
  removedIoNotification();
}

function setIoItem(type, index, sourceUniverse, targetUniverse) {
  loadIoDict();
  var inputs = ioObj.inputs;
  if (!inputs) return;
  var outputs = ioObj.outputs;
  if (!outputs) return;

  loadDevicesDict();
  var devices = devicesObj.io_devices;

  var inputOrOutput;

  switch (type) {
    case "ArtNetInput":
      var input = inputs[index];
      if (!input) return;
      inputs[index] = CreateArtNetInput(sourceUniverse, targetUniverse);

      inputOrOutput = 0;

      break;
    case "ArtNetOutput":
      var output = outputs[index];
      if (!output) return;
  
      var address = arguments[4];
      outputs[index] = CreateArtNetOutput(address, sourceUniverse, targetUniverse);

      inputOrOutput = 1;

      break;
    case "ArtNetNodeOutput":
      var output = outputs[index];
      if (!output) return;

      var name = arguments[4];

      outputs[index] = CreateArtNetNodeOutput(name, sourceUniverse, targetUniverse);

      inputOrOutput = 1;

      break;
    case "USBOutput":
      var output = outputs[index];
      if (!output) return;

      var identifier = {
        name: arguments[4],
        vendorId: arguments[5],
        productId: arguments[6]
      };

      outputs[index] = CreateUSBOutput(identifier, sourceUniverse, targetUniverse);

      inputOrOutput = 1;

      break;
    case "CITPOutput":
      var output = outputs[index];
      if (!output) return;

      var name = arguments[4];

      outputs[index] = CreateCITPOutput(name, sourceUniverse, targetUniverse);

      inputOrOutput = 1;

      break;
    default:
      return;
  }


  updateDict(ioDict, ioObj);
  updatedIoNotification(inputOrOutput, index)
}