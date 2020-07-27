/// @ts-check

const host = '//192.168.0.46';
const baseXMLAPIpath = '/addons/xmlapi/';

const devicelistUrl = host + baseXMLAPIpath + 'devicelist.cgi';
const statelistUrl = host + baseXMLAPIpath + 'statelist.cgi';
const valuechangeUrl = host + baseXMLAPIpath + 'mastervaluechange.cgi';
const statechangeUrl = host + baseXMLAPIpath + 'statechange.cgi';
const stateUrl = host + baseXMLAPIpath + 'state.cgi';

const hmIpBslColorMap = [
  'gray',
  'BLUE',
  'GREEN',
  'TURQUOISE',
  'RED',
  'PURPLE',
  'YELLOW',
  'WHITE'
]

/** @type document */
let devicelistDocument;

/** @type document */
let stateListDocument;

let DomParser = new window.DOMParser();
// const xhr = new XMLHttpRequest();
// xhr.open('GET', statelistUrl,false);
// xhr.send();
const outputElem = document.getElementById('output');

/** key is the iseId
 * @type {Map<string, Set<(hmValue: string)=>void>>} */
const monitorList = new Map();


/**
 *
 * @param {string|object} message
 * @param {string} cssText
 */
const outputFnc = (message, cssText = '') => {
  outputElem.innerHTML = message;
  outputElem.style.cssText = cssText;
}

outputFnc('loading...');

/**
 *
 * @param {string} xmlString
 * @param {'devicelist'|'statelist'|string} type
 */
const stringToDocument = (xmlString, type) => {
  if (!xmlString) {
    return false;
  }
  let doc = (DomParser).parseFromString(xmlString, "text/xml");
  switch (type) {
    case 'devicelist':
      devicelistDocument = doc;
      break;
    case 'statelist':
      stateListDocument = doc;
      break;
  }
  // if (typeof db !== 'undefined') {
  //   db.transaction("xmlApiCache").objectStore(type).add(doc).onsuccess = function (event) {
  //     console.log('saved document', type);
  //   };
  // }
  return true;
}

// const openDBrequest = window.indexedDB.open("xmlApiCache", 1);
// /** @type {IDBDatabase} */
// let db;
// openDBrequest.onerror = function (event) {
//   console.error(event);
// };
// openDBrequest.onupgradeneeded = function () {
//   db = openDBrequest.result;
//   db.createObjectStore('devicelist');
//   db.createObjectStore('statelist');
// }
// openDBrequest.onsuccess = (event) => {
//   db = event.target.result;

//   // db.transaction("xmlApiCache").objectStore("devicelist").add("devicelist").onsuccess = function (event) {
//   //   console.log("Name for SSN 444-44-4444 is " + event.target.result);
//   // };
//   let requestDeviceList = db.transaction("xmlApiCache").objectStore("devicelist").get("devicelist");
//   requestDeviceList.onsuccess = function (event) {
//     debugger;
//     if (event.target.result) {
//       console.log('Found a devicelist', event.target.result);
//     } else {
//       console.log('Found no devicelist');
//     }
//   };
//   requestDeviceList.onerror = function (event) {
//     debugger;
//     console.log(event.target.result);
//   };
// }

const statelistPromise =
  fetch(statelistUrl)
    .then((response) => {
      if (response && response.ok) {
        return response.text();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then(str => {
      try {
        window.localStorage.setItem('statelist', str);
      } catch (error) {
        // skip
      }
      return str;
    })
    .then(str => stringToDocument(str, 'statelist'))
  ;
const devicelistPromise =
  fetch(devicelistUrl)
    .then((response) => {
      if (response && response.ok) {
        return response.text();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then(str => {
      try {
        window.localStorage.setItem('devicelist', str);
      } catch (error) {
        // skip
      }
      return str;
    })
    .then(str => stringToDocument(str, 'devicelist'))
    .catch(ex => {
      console.error(ex);
      if (ex instanceof TypeError) {
        outputFnc('Error in request(parsing): ' + ex +
          '<br>You could try to open the <a target="_blank" href="' + devicelistUrl + '">url</a> manually.', 'color: red;');
      } else {
        outputFnc('Error in request(parsing): ' + ex, 'color: red;');
      }
    })
  ;

let parseSuccess = true;
const list = ['devicelist', 'statelist'];
for (let listId = 0; listId < list.length && parseSuccess; listId++) {
  parseSuccess = stringToDocument(window.localStorage.getItem(list[listId]), list[listId])
}
if (parseSuccess) {
  renderGui();
} else {
  Promise.all([devicelistPromise, statelistPromise])
    .then(renderGui);
}

/**
 * @param {string} string
 */
function ansiToNativeString(string) {
  return string
    .replace(/K�che/g, 'Küche')
    .replace(/T�r/g, 'Tür')
    .replace(/ger�t/g, 'gerät')
}

function renderGui() {
  /** @type NodeListOf<HTMLElement> */
  let allHomematicDivs = document.querySelectorAll('[data-hm-adress]');

  for (const homematicDiv of allHomematicDivs) {
    const deviceBaseadress = homematicDiv.dataset.hmAdress;
    let overrideIndex = homematicDiv.dataset.hmOverrideIndex;
    let overrideDatapointTypeArr = homematicDiv.dataset.hmDatapointType?.split('|');
    let overrideDatapointTypeLabelArr = homematicDiv.dataset.hmDatapointTypeLabel?.split('|');
    let datapointType;
    let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType, overrideIndex);
    let labelDiv = document.createElement('div');
    labelDiv.classList.add('label');
    labelDiv.innerText = ansiToNativeString(deviceInfo.device.deviceName);
    homematicDiv.appendChild(labelDiv);
    //homematicDiv.appendChild(document.createTextNode(ansiToNativeString(deviceInfo.deviceName)));
    homematicDiv.title = deviceInfo.device.type;
    /** @type string|undefined */
    switch (deviceInfo.device.type) {
      case 'HmIP-FROLL': // Shutter actuator - flush mount
        {
          datapointType = 'LEVEL';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType, overrideIndex);
          if (homematicDiv.dataset.hmReadonly === undefined) {
            homematicDiv.appendChild(createButton('Hoch', '1', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('Halb', '0.5', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('80%', '0.2', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('Runter', '0', deviceInfo.firstActorChannel.iseId));
          }
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value)) {
              homematicDiv.style.background = 'red';
            } else if (value == 0) {
              homematicDiv.style.background = 'gray';
            } else {
              homematicDiv.style.background = 'linear-gradient(0deg, #A3FF00 ' + ((value) * (100 / 100)) * 100 + '%, gray 0)'
            }
          });

          break;
        }
      case 'HmIP-BROLL': // Shutter actuator for Brand Switch Systems
        {
          datapointType = 'LEVEL';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType, overrideIndex);
          if (homematicDiv.dataset.hmReadonly === undefined) {
            homematicDiv.appendChild(createButton('Hoch', '1', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('Halb', '0.6', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('Streifen', '0.2', deviceInfo.firstActorChannel.iseId));
            homematicDiv.appendChild(createButton('Runter', '0', deviceInfo.firstActorChannel.iseId));
          }
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value)) {
              homematicDiv.style.background = 'repeating-linear-gradient(-55deg,#f5c7c7,#f5c7c7 10px,white 10px,white 20px)';
            } else if (value == 0) {
              homematicDiv.style.background = 'gray';
            } else if (value <= 0.2) {
              homematicDiv.style.background = 'repeating-linear-gradient(gray, gray 20px, #A3FF00 20px, #A3FF00 25px)';
            } else {
              homematicDiv.style.background = 'linear-gradient(0deg, #A3FF00 ' + ((value - 0.2) * (100 / 80)) * 100 + '%, gray 0)'
            }
          });

          break;
        }
      case 'HMIP-PS': // Pluggable Switch
      case 'HMIP-PSM': // Pluggable Switch with Measuring
      case 'HmIP-FSM': // Full flush switch actuator with Measuring
      case 'HmIP-BSM': // Switch actuator with Measuring for Brand Switch Systems
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          if (homematicDiv.dataset.hmReadonly === undefined) {
            homematicDiv.appendChild(createButton('An', 'true', deviceInfo.selectedDatapoints[1].iseId));
            homematicDiv.appendChild(createButton('Aus', 'false', deviceInfo.selectedDatapoints[1].iseId));
          }
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            if (valueStr === 'true') {
              homematicDiv.style.backgroundColor = 'yellow';
            } else if (valueStr === 'false') {
              homematicDiv.style.backgroundColor = 'gray';
            }
          });
          break;
        }
      case 'HmIP-SRH':  // Window Handle Sensor
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            if (valueStr === '0') {
              homematicDiv.style.backgroundColor = 'green';
            } else if (valueStr === '1') {
              homematicDiv.style.backgroundColor = 'orange';
            } else if (valueStr === '2') {
              homematicDiv.style.backgroundColor = 'red';
            }
          });
          break;
        }
      case 'HMIP-SWDO': // Wireless Window/Door Sensor (optic)
      case 'HmIP-SWDO-I': // Wireless Window/Door Sensor integrated
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            if (valueStr === '0') {
              homematicDiv.style.backgroundColor = 'green';
            } else if (valueStr === '1') {
              homematicDiv.style.backgroundColor = 'red';
            }
          });
          break;
        }
      case 'HmIP-SWD': // Watersensor
        {
          datapointType = 'WATERLEVEL_DETECTED';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            if (valueStr === 'true') {
              homematicDiv.style.backgroundColor = 'red';
            } else if (valueStr === 'false') {
              homematicDiv.style.backgroundColor = 'green';
            }
          });
          break;
        }
      case 'HmIP-SWSD': // Smoke Detektor
        {
          datapointType = 'SMOKE_DETECTOR_ALARM_STATUS';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            if (valueStr === '0') {
              // Idle Off
              homematicDiv.style.backgroundColor = 'green';
            } else if (valueStr === '1') {
              // Primary (own) Alarm
              homematicDiv.style.backgroundColor = 'red';
            } else if (valueStr === '2') {
              // Intrusion Detection
              homematicDiv.style.backgroundColor = 'yellow';
            } else if (valueStr === '3') {
              // Secondary (remote) Alarm
              homematicDiv.style.backgroundColor = 'indianred';
            }
          });
          break;
        }
      case 'HmIP-KRC4': // Keyring Remote Control - 4 Buttons
        {
          let oldLowBatStr;
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress);
          addHmMonitoring(deviceInfo.batteryDatapoint.lowBatIseId, (valueStr) => {
            if (valueStr === oldLowBatStr) {
              return;
            }
            oldLowBatStr = valueStr;
            if (valueStr !== 'true') {
              homematicDiv.style.backgroundColor = 'green';
            } else {
              homematicDiv.style.backgroundColor = 'red';
            }
          });
          break;
        }
      case 'HmIP-BSL': // Switch actuator for brand switches – with Signal Lamp
        {
          datapointType = 'COLOR';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);

          let bslTop = document.createElement('div');
          bslTop.style.cssText = 'height: 1em;border: 1px solid black;padding: 0px;margin: 0;';
          homematicDiv.appendChild(bslTop);
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            bslTop.style.backgroundColor = hmIpBslColorMap[valueStr];
          });
          let bslBottom = document.createElement('div');
          bslBottom.style.cssText = 'height: 1em;border: 1px solid black;padding: 0px;margin: 0;';
          homematicDiv.appendChild(bslBottom);
          addHmMonitoring(deviceInfo.selectedDatapoints[4].iseId, (valueStr) => {
            bslBottom.style.backgroundColor = hmIpBslColorMap[valueStr];
          });
          break;
        }
      case 'HmIP-RCV-50':
        {
          // Special
          if (!overrideDatapointTypeArr) {
            homematicDiv.firstChild.nodeValue = 'missing datapoint info';
            break;
          }
          for (let i = 0; i < overrideDatapointTypeArr.length; i++) {
            let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, overrideDatapointTypeArr[i], overrideIndex);
            if (homematicDiv.dataset.hmReadonly === undefined) {
              homematicDiv.appendChild(createButton(overrideDatapointTypeLabelArr[i], '1', deviceInfo.selectedDatapoints[0].iseId));
            }
            homematicDiv.firstElementChild.firstChild.nodeValue = deviceInfo.selectedDatapoints[0].name;
          }
          break;
        }
      default:
        {
          const errorDiv = document.createElement('div');
          errorDiv.innerHTML = 'Aktor des Typs <span style="color:red;">' + deviceInfo.device.type + '</span> nicht bekannt.';
          homematicDiv.appendChild(errorDiv);
          break;
        }
    }
    if (deviceInfo.batteryDatapoint.lowBatIseId) {
      let oldLowBatStr, oldOpVoltStr;
      let opVoltDiv = document.createElement('div');
      opVoltDiv.classList.add('opVolt');
      homematicDiv.appendChild(opVoltDiv);
      addHmMonitoring(deviceInfo.batteryDatapoint.lowBatIseId, (valueStr) => {
        if (valueStr === oldLowBatStr) {
          return;
        }
        oldLowBatStr = valueStr;
        if (valueStr !== 'true') {
          homematicDiv.style.borderColor = 'green';
        } else {
          homematicDiv.style.borderColor = 'red';
        }
      });
      addHmMonitoring(deviceInfo.batteryDatapoint.opVoltIseId, (valueStr) => {
        if (valueStr === oldOpVoltStr) {
          return;
        }
        oldOpVoltStr = valueStr;
        let opVolt = parseFloat(valueStr);
        if (!Number.isNaN(opVolt) && opVolt !== 0) {
          opVoltDiv.innerText = opVolt.toLocaleString(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
          }) + ' V';
        }
      });
    }
    if (deviceInfo.power.iseId) {
      let oldPowerStr;
      let powerDiv = document.createElement('div');
      powerDiv.classList.add('power');
      homematicDiv.appendChild(powerDiv);
      addHmMonitoring(deviceInfo.power.iseId, (valueStr) => {
        if (valueStr === oldPowerStr) {
          return;
        }
        oldPowerStr = valueStr;
        let power = parseFloat(valueStr);
        if (!Number.isNaN(power)) {
          powerDiv.innerText = power.toLocaleString(undefined, {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
          }) + ' ' + deviceInfo.power.valueunit;
        }
      });
    }
  }

  outputFnc('');
}

/**
 *
 * @param {string} hmAdress
 * @param {string} datapointType Find a specific datapoint of this device
 * @param {string|undefined} overrideIndex
 */
function getDeviceInfo(hmAdress, datapointType = undefined, overrideIndex = undefined) {
  let deviceList_deviceNode = devicelistDocument.querySelector(
    'device[address="' + hmAdress + '"]'
  );
  let deviceIse = deviceList_deviceNode.getAttribute('ise_id');
  let firstActorChannelNode = deviceList_deviceNode.querySelector('channel[direction="RECEIVER"][visible="true"]');
  let firstActorChannelIndex = firstActorChannelNode?.getAttribute('index') ?? overrideIndex;

  let stateList_deviceNode = stateListDocument.querySelector(
    'device[ise_id="' + deviceIse + '"]'
  );

  let selectedDatapointNodes;
  /**@type{{
        iseId: string;
        name: string;
      }[]} */
  let selectedDatapointNodeArray = [];
  if (datapointType) {
    // if (firstActorChannelIndex !== undefined) {
    //   let stateList_firstActorChannelNode =
    //     stateList_deviceNode.querySelector('channel[index="' + firstActorChannelIndex + '"][visible="true"]');
    //   firstStateOrLevelDatapointNode =
    //     stateList_firstActorChannelNode?.querySelector('datapoint[type="' + datapointType + '"]');
    // } else {
    //   // No Actor. Find first datapointType
    selectedDatapointNodes =
      stateList_deviceNode.querySelectorAll('datapoint[type="' + datapointType + '"]');
    //    }
    selectedDatapointNodes.forEach(data => {
      selectedDatapointNodeArray.push({
        iseId: data?.getAttribute('ise_id'),
        name: data?.parentElement?.getAttribute('name')
      })
    });
  }
  let powerDatapointNode =
    stateList_deviceNode.querySelector('datapoint[type="' + 'POWER' + '"]');
  let tempDatapointNode =
    stateList_deviceNode.querySelector('datapoint[type="' + 'ACTUAL_TEMPERATURE' + '"]');
  let lowBatDatapointNode =
    stateList_deviceNode.querySelector('datapoint[type="' + 'LOW_BAT' + '"]');
  let opVoltDatapointNode =
    stateList_deviceNode.querySelector('datapoint[type="' + 'OPERATING_VOLTAGE' + '"]');

  return {
    device: {
      type: deviceList_deviceNode.getAttribute('device_type'),
      deviceName: deviceList_deviceNode?.getAttribute('name')
    },
    firstActorChannel: {
      iseId: firstActorChannelNode?.getAttribute('ise_id'),
      index: firstActorChannelNode?.getAttribute('index')
    },
    selectedDatapoints: selectedDatapointNodeArray,
    tempDatapoint: {
      iseId: tempDatapointNode?.getAttribute('ise_id'),
      name: tempDatapointNode?.getAttribute('name')
    },
    batteryDatapoint: {
      lowBatIseId: lowBatDatapointNode?.getAttribute('ise_id'),
      name: lowBatDatapointNode?.getAttribute('name'),
      opVoltIseId: opVoltDatapointNode?.getAttribute('ise_id'),
    },
    power: {
      iseId: powerDatapointNode?.getAttribute('ise_id'),
      name: powerDatapointNode?.getAttribute('name'),
      valueunit: powerDatapointNode?.getAttribute('valueunit')
    }
  };
}


/**
 * @param {MouseEvent} evt
 * @this {HTMLElement}
 */
function clickHandler(evt) {
  const target = this;
  let message;
  /** @type {HTMLElement} */
  let labelDiv = target.parentElement.querySelector('.label');
  if (
    labelDiv.firstChild.nodeValue.includes('Vera')
    || labelDiv.firstChild.nodeValue.includes('Laura')
  ) {
    message = 'Wirklich einen Aktor bei den Kindern schalten?';
  } else if (labelDiv.firstChild.nodeValue.includes('Heizung')) {
    message = 'Wirklich eine Heizung schalten?';
  }

  if (message && !confirm(message)) {
    return;
  }
  setHomematicValue(
    target.dataset.hmActorDatapointId,
    target.dataset.hmActorValue
  )
    .then(doc => {
      outputFnc('Success in writing value: ' + target.dataset.hmActorValue + ', to ise id: ' + target.dataset.hmActorDatapointId, 'color: green;');
    })
}

/**
 *
 * @param {string} title
 * @param {string} value
 * @param {string} datapointId
 */
function createButton(title, value, datapointId, classList = []) {
  const button = document.createElement('button');
  button.addEventListener('click', clickHandler);
  button.innerHTML = title;
  button.dataset.hmActorValue = value;
  button.dataset.hmActorDatapointId = datapointId;
  button.classList.add(...classList);
  return button;
}

/**
 *
 * @param {string|string[]} ise_id
 * @param {string|string[]} value
 */
function setHomematicValue(ise_id, value) {
  if (!Array.isArray(ise_id)) {
    ise_id = [ise_id];
  }
  if (!Array.isArray(value)) {
    value = [value];
  }
  return fetch(
    statechangeUrl
    + '?' + 'ise_id=' + ise_id.join(',')
    + '&' + 'new_value=' + value.join(',')
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .catch(ex => {
      console.error(ex);
    })
    ;
}

/**
 *
 * @param {string[]} iseIds
 */
function getMultipleHomematicValue(iseIds) {
  return fetch(
    stateUrl
    + '?' + 'datapoint_id=' + iseIds.join(',')
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .then(doc => {
      /**@type {Map<string, string>} */
      let valueMap = new Map();
      iseIds.forEach(id => {
        valueMap.set(id, doc.querySelector('datapoint[ise_id="' + id + '"]')?.getAttribute('value'));
      });
      return valueMap;
    })
    .catch(ex => {
      console.error(ex);
      throw new Error('Unexpected error');
    })
    ;
}

/**
 *
 * @param {string} ise_id
 */
function getHomematicValue(ise_id) {
  if (!ise_id) {
    return new Promise(data => { });
  }
  return fetch(
    stateUrl
    + '?' + 'datapoint_id=' + ise_id
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .then(doc => {
      return doc.querySelector('datapoint[ise_id="' + ise_id + '"]')?.getAttribute('value');
    })
    .catch(ex => {
      console.error(ex);
      throw new Error('Unexpected error');
    })
    ;
}

/**
 *
 * @param {string|undefined} iseId
 * @param {()=>void} callback
 */
function addHmMonitoring(iseId, callback) {
  if (!iseId) {
    return;
  }
  let subSet = monitorList.get(iseId);
  if (!subSet) {
    subSet = new Set();
    monitorList.set(iseId, subSet);
  }
  subSet.add(callback);
}

let hmMonitoring = function () {
  if (monitorList.size) {
    getMultipleHomematicValue(Array.from(monitorList.keys()))
      .then(resultMap => {
        resultMap.forEach((hmValue, iseId) => {
          let cbList = monitorList.get(iseId);
          cbList.forEach(cb => {
            cb(hmValue);
          })
        })
      });
  }
  setTimeout(hmMonitoring, 1000);
};
hmMonitoring();
