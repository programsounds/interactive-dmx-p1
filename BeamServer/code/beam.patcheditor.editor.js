var VERSION = 1;
var PATCH_DICT_ID = jsarguments[1];
var PROFILES_DICT_ID = jsarguments[2];

var patchDict = new Dict(PATCH_DICT_ID);
var patchObj = {};

var profilesDict = new Dict(PROFILES_DICT_ID);
var profilesObj = {};

function loadPatchDict() {
  patchObj = JSON.parse(patchDict.stringify());
}

function loadProfilesDict() {
  profilesObj = JSON.parse(profilesDict.stringify());
}

function updateDict(targetDict, targetObj) {
  targetDict.parse(JSON.stringify(targetObj));
}

function updatedFixtureNotification(parentFixtureIndex) {
  outlet(0, PATCH_DICT_ID, "fixtureUpdate", parentFixtureIndex, -1);
}

function updatedFixtureListNotification() {
  outlet(0, PATCH_DICT_ID, "fixtureListUpdate");
}

function updatedTagListNotification(parentFixtureIndex) {
  outlet(0, PATCH_DICT_ID, "tagListUpdate", parentFixtureIndex);
}

function updatedCellTagListNotification(parentFixtureIndex, cellPath) {
  outlet(0, PATCH_DICT_ID, "tagListUpdate", parentFixtureIndex, cellPath);
}

function removedFixtureNotification() {
  outlet(0, PATCH_DICT_ID, "removedFixture");
}

function initPatch() {
  loadPatchDict();

  if (!patchObj.hasOwnProperty("version")) {
    patchObj.version = VERSION;
  }
  if (!patchObj.hasOwnProperty("fixtures")) {
    patchObj.fixtures = [];
  }

  updateDict(patchDict, patchObj);
}

function newPatch() {
  loadPatchDict();

  patchObj.version = VERSION;
  patchObj.fixtures = [];

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getNestedValue(obj, path) {
  var keys = path.split("::");
  var targetCell = obj;
  keys.forEach(function (key) {
    var parts = key.split("[");
    var prop = parts[0];
    var index = parseInt(parts[1].slice(0, -1));
    targetCell = targetCell[prop][index];
  });
  return targetCell;
}

function mapCells(modulatable, cb) {
  if (modulatable.cells === undefined) {
    return modulatable;
  }

  var cells = [];
  for (var i = 0; i < modulatable.cells.length; i++) {
    var cell = modulatable.cells[i];
    var updatedCell = cb(cell);
    if (updatedCell.cells) {
      updatedCell.cells = mapCells(updatedCell, cb).cells;
    }
    cells.push(updatedCell);
  }
  modulatable.cells = cells;
  return modulatable;
}

function ProfileWithType(type, profiles, modeName) {
  var profile;
  for (var profileName in profiles) {
    if (profileName === type) {
      profile = profiles[profileName];
    }
  }
  if (profile === undefined) {
    return undefined;
  }

  if (profile.modes && Object.keys(profile.modes).length > 0) {
    var validModeNameSpecified =
      modeName !== undefined &&
      modeName !== "" &&
      modeName !== "__nomodespecified" &&
      profile.modes[modeName] !== undefined;
    var firstMode = Object.keys(profile.modes)[0];
    var modeToSelect = validModeNameSpecified ? modeName : firstMode;
    profile = profile.modes[modeToSelect];

    return {
      addresses: profile.addresses,
      children: profile.children,
      type: profile.type,
      cells: profile.cells ? profile.cells : [],
    };
  } else {
    return profile;
  }
}

function getFirstModeName(type, profiles) {
  var profile;
  for (var profileName in profiles) {
    if (profileName === type) {
      profile = profiles[profileName];
    }
  }
  if (profile === undefined) {
    return "";
  }

  if (profile.modes && Object.keys(profile.modes).length > 0) {
    return Object.keys(profile.modes)[0];
  } else {
    return "";
  }
}

function WithTagOffset(tags, offset) {
  var tagList = [];

  for (var i = 0; i < tags.length; i++) {
    tagList.push({
      name: tags[i].name,
      index: tags[i].index + offset,
    });
  }

  return tagList;
}

function CreateTags(names, offset) {
  var tagList = [];

  for (var i = 0; i < names.length; i++) {
    tagList.push({
      name: names[i],
      index: 60 + offset,
    });
  }

  return tagList;
}

function CreateFixture(fixture) {
  return {
    name: fixture.name,
    type: fixture.type,
    modeName: fixture.modeName,
    channel: fixture.channel,
    universe: fixture.universe,
    tags: fixture.tags,
    ranges: [],
    testOn: false,
    children: [],
    cells: fixture.cells,
  };
}

function ChildrenForFixtures(parent, profiles) {
  var fixtureList = [];

  var parentProfile = ProfileWithType(parent.type, profiles, parent.modeName);
  var children = parentProfile.children || [];

  for (var i = 0; i < children.length; i++) {
    var profile = ProfileWithType(children[i].profile, profiles, "");
    var type = profile ? children[i].profile : "";
    var tags = WithTagOffset(parent.tags, i);
    var ranges = parent.ranges;
    var universe = parent.universe;
    var channel = parent.channel + (children[i].address - 1);
    var name = children[i].name;
    var fixture = CreateFixture({
      name: name,
      type: type,
      modeName: "",
      universe: universe,
      channel: channel,
      tags: tags,
      ranges: ranges,
    });

    fixtureList.push(fixture);
  }

  return fixtureList;
}

function CreateFixtures(amount, data, profiles) {
  var fixtureList = [];

  var profile = ProfileWithType(data.type, profiles, data.modeName);
  if (profile === undefined) {
    return fixtureList;
  }

  var tagOffset = 0;
  for (var i = 0; i < amount; i++) {
    var channel = data.address + i * profile.addresses;
    var tags = CreateTags(data.tagNames, tagOffset);
    var fixture = CreateFixture({
      name: data.name,
      type: data.type,
      modeName:
        data.modeName === "__nomodespecified" || data.modeName === undefined
          ? ""
          : data.modeName,
      channel: channel,
      universe: data.universe,
      cells: profile.cells,
      tags: tags,
    });

    var initialTagOffset = tagOffset;

    fixture.children = ChildrenForFixtures(fixture, profiles);
    tagOffset += profile.children.length;

    var cellCount = 0;
    mapCells(fixture, function (cell) {
      cell.tags = WithTagOffset(tags, cellCount++);
      return cell;
    });

    tagOffset += cellCount;

    if (tagOffset === initialTagOffset) {
      tagOffset += 1;
    }

    fixtureList.push(clone(fixture));
  }

  return fixtureList;
}

function addFixtures(
  enteredName,
  selectedProfile,
  selectedMode,
  amountOfFixtures,
  startUniverse,
  startAddress,
  tagNames
) {
  var tags = [];
  if (arguments.length > 7) {
    for (var i = 0; i < arguments.length - 6; i++) {
      tags.push(arguments[i + 6]);
    }
  } else if (arguments.length == 7) {
    tags.push(arguments[6]);
  }

  var data = {
    name: enteredName,
    type: selectedProfile,
    modeName: selectedMode,
    universe: startUniverse,
    address: startAddress,
    tagNames: tags,
  };

  loadProfilesDict();
  var newFixtures = CreateFixtures(amountOfFixtures, data, profilesObj);

  initPatch();

  patchObj.fixtures = patchObj.fixtures.concat(newFixtures);

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}
function removeAllFixtures() {
  patchObj.fixtures = [];

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}
function removeFixture(parentFixtureIndex) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  patch.splice(parentFixtureIndex, 1);

  updateDict(patchDict, patchObj);
  removedFixtureNotification();
}

function setFixtureName(parentFixtureIndex, newFixtureName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  parent["name"] = newFixtureName;

  updateDict(patchDict, patchObj);
  updatedFixtureNotification(parentFixtureIndex);
}

function setFixtureProfile(parentFixtureIndex, newProfile, modeName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  loadProfilesDict();
  var profiles = profilesObj;

  var profile = ProfileWithType(newProfile, profiles, modeName);
  if (profile === undefined) {
    return;
  }

  parent.type = newProfile;
  parent.modeName =
    modeName === "__nomodespecified" || modeName === undefined
      ? getFirstModeName(newProfile, profiles)
      : modeName;
  parent.children = ChildrenForFixtures(parent, profiles);
  if (!profile.cells) {
    parent.cells = [];
  } else {
    parent.cells = profile.cells;
  }

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}

function setFixtureUniverse(parentFixtureIndex, newUniverse) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  parent.universe = newUniverse;

  for (var i = 0; i < parent.children.length; i++) {
    parent.children[i].universe = newUniverse;
  }

  updateDict(patchDict, patchObj);
  updatedFixtureNotification(parentFixtureIndex);
}
function setFixtureStartAddress(parentFixtureIndex, newStartAddress) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  parent.channel = newStartAddress;

  for (var i = 0; i < parent.children.length; i++) {
    parent.children[i].channel = newStartAddress + i;
  }

  updateDict(patchDict, patchObj);
  updatedFixtureNotification(parentFixtureIndex);
}

function deleteTagFromFixture(fixture, tagName) {
  if (fixture.tags === undefined) {
    return fixture;
  }

  var tags = fixture.tags;

  var existing = -1;
  for (var i = 0; i < tags.length; i++) {
    if (tags[i]["name"] === tagName) {
      existing = i;
      break;
    }
  }

  if (existing >= 0) {
    tags.splice(existing, 1);
    return fixture;
  }

  return fixture;
}

function addTagToFixture(fixture, tag, offset) {
  deleteTagFromFixture(fixture, tag["name"]);

  if (fixture.tags === undefined) {
    fixture.tags = [];
  }

  var tags = fixture.tags;
  var newTag = {
    name: tag["name"],
    index: tag["index"] + offset,
  };

  tags.push(newTag);
}

function addTag(parentFixtureIndex) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  var newTag = { name: "", index: 60 };

  addTagToFixture(parent, newTag, 0);

  var tagOffset = 0;

  var children = parent.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    addTagToFixture(child, newTag, tagOffset++);
  }

  mapCells(parent, function (cell) {
    addTagToFixture(cell, newTag, tagOffset++);
    return cell;
  });

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function addTagToChild(parentFixtureIndex, childIndex) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  var child = parent.children[childIndex];
  if (!child) return;

  var newTag = { name: "", index: 60 };

  addTagToFixture(child, newTag, 0);

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function addTagToCell(parentFixtureIndex, cellPath) {
  loadPatchDict();
  var patch = patchObj;
  if (!patch) return;

  var cell = getNestedValue(patch, cellPath);
  if (!cell) return;

  var newTag = { name: "", index: 60 };

  addTagToFixture(cell, newTag, 0);

  updateDict(patchDict, patchObj);
  updatedCellTagListNotification(parentFixtureIndex, cellPath);
}

function setTagName(parentFixtureIndex, currentTagName, newTagName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  var tags = parent.tags;
  var currentTagIndex;
  for (var i = 0; i < tags.length; i++) {
    if (tags[i]["name"] === currentTagName) {
      currentTagIndex = tags[i]["index"];
      break;
    }
  }

  deleteTagFromFixture(parent, currentTagName);

  var newTag = {
    name: newTagName,
    index: currentTagIndex,
  };

  addTagToFixture(parent, newTag, 0);

  var tagOffset = 0;

  var children = parent.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    deleteTagFromFixture(child, currentTagName);
    addTagToFixture(child, newTag, tagOffset++);
  }

  mapCells(parent, function (cell) {
    deleteTagFromFixture(cell, currentTagName);
    addTagToFixture(cell, newTag, tagOffset++);
    return cell;
  });

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function setChildTagName(
  parentFixtureIndex,
  childIndex,
  currentTagName,
  newTagName
) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  var child = parent.children[childIndex];
  if (!child) return;

  var tags = child.tags;
  var currentTagIndex;
  for (var i = 0; i < tags.length; i++) {
    if (tags[i]["name"] === currentTagName) {
      currentTagIndex = tags[i]["index"];
      break;
    }
  }

  deleteTagFromFixture(child, currentTagName);

  var newTag = {
    name: newTagName,
    index: currentTagIndex,
  };

  addTagToFixture(child, newTag, 0);

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function setCellTagName(
  parentFixtureIndex,
  cellPath,
  currentTagName,
  newTagName
) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var cell = getNestedValue(patchObj, cellPath);
  if (!cell) return;

  var tags = cell.tags;
  if (!tags) return;

  var currentTagIndex;
  for (var i = 0; i < tags.length; i++) {
    if (tags[i]["name"] === currentTagName) {
      currentTagIndex = tags[i]["index"];
      break;
    }
  }

  deleteTagFromFixture(cell, currentTagName);

  var newTag = {
    name: newTagName,
    index: currentTagIndex,
  };

  addTagToFixture(cell, newTag, 0);

  updateDict(patchDict, patchObj);
  updatedCellTagListNotification(parentFixtureIndex, cellPath);
}

function removeTag(parentFixtureIndex, tagName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  deleteTagFromFixture(parent, tagName);

  var children = parent.children;
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    deleteTagFromFixture(child, tagName);
  }

  mapCells(parent, function (cell) {
    deleteTagFromFixture(cell, tagName);
    return cell;
  });

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function removeTagFromChild(parentFixtureIndex, childIndex, tagName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  var child = parent.children[childIndex];
  if (!child) return;

  deleteTagFromFixture(child, tagName);

  updateDict(patchDict, patchObj);
  updatedTagListNotification(parentFixtureIndex);
}

function removeTagFromCell(parentFixtureIndex, cellPath, tagName) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var cell = getNestedValue(patchObj, cellPath);
  if (!cell) return;

  deleteTagFromFixture(cell, tagName);

  updateDict(patchDict, patchObj);
  updatedCellTagListNotification(parentFixtureIndex, cellPath);
}

function setFixtureTestOn(parentFixtureIndex, testOn) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  if (testOn === 1) {
    testOn = true;
  } else {
    testOn = false;
  }
  parent.testOn = testOn;

  for (var i = 0; i < parent.children.length; i++) {
    parent.children[i].testOn = testOn;
  }

  updateDict(patchDict, patchObj);
  updatedFixtureNotification(parentFixtureIndex);
}

function setFixturePositionUp(parentFixtureIndex) {
  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  if (parentFixtureIndex >= patch.length - 1) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  arraymove(patch, parentFixtureIndex, parentFixtureIndex + 1);

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}

function setFixturePositionDown(parentFixtureIndex) {
  if (parentFixtureIndex <= 0) return;

  loadPatchDict();
  var patch = patchObj.fixtures;
  if (!patch) return;

  var parent = patch[parentFixtureIndex];
  if (!parent) return;

  arraymove(patchObj.fixtures, parentFixtureIndex, parentFixtureIndex - 1);

  updateDict(patchDict, patchObj);
  updatedFixtureListNotification();
}

function arraymove(arr, fromIndex, toIndex) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}
