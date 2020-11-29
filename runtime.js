const host = '//' + document.body.dataset.hmXmlapiHost;
const baseXMLAPIpath = '/addons/xmlapi/';

/** @typedef  {  'devicelist'|'statelist'|'sysvarlist'} configFilenameList */
/** @type configFilenameList[] */
const configFilenameList = ['devicelist', 'statelist', 'sysvarlist'];
/** Mapping from list name to url
 *  @type Map<configFilenameList, string> */
const configUrlMap = new Map();
configFilenameList.forEach(name => {
  configUrlMap.set(name, host + baseXMLAPIpath + name + '.cgi')
})

/** @type {Map<configFilenameList,document>} */
const cachedDocuments = new Map();

const DomParser = new window.DOMParser();
const isoTextdecoder = new TextDecoder('iso-8859-15');
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
 */
const stringToDocument = (xmlString) => {
  return DomParser.parseFromString(xmlString, "text/xml");
}

function urlToString(url) {
  return fetch(url)
    .then(response => {
      if (response && response.ok) {
        return response.arrayBuffer();
      } else {
        throw new Error('Something went wrong in the request');
      }
    })
    .then(arrayBuffer => {
      const decodedString = isoTextdecoder.decode(new DataView(arrayBuffer));
      return decodedString;
    })
}
function urlToDoc(url) {
  return urlToString(url)
    .then(stringToDocument)
}
const createFetchPromise = (/** @type configFilenameList */ filename) => {
  return urlToString(configUrlMap.get(filename))
    .then(str => {
      try {
        window.localStorage.setItem(filename, str);
      } catch (error) {
        // skip
      }
      return str;
    })
    .then(stringToDocument)
    .then(doc => {
      return cachedDocuments.set(filename, doc);
    })
    .catch(ex => {
      // console.error(ex);
      if (ex instanceof TypeError) {
        outputFnc('Error in request(parsing): ' + ex +
          '<br>You could try to open the <a target="_blank" href="' + configUrlMap.get(filename) + '">url</a> manually.', 'color: red;');
      } else {
        outputFnc('Error in request(parsing): ' + ex, 'color: red;');
      }
    })
    ;
}
const fetchPromiseList = [];
let parseSuccess = true;
for (let filename of configFilenameList) {
  let cacheEntry = window.localStorage.getItem(filename);
  if (cacheEntry) {
    cachedDocuments.set(filename, stringToDocument(cacheEntry));
  } else {
    parseSuccess = false;
  }
  // fetch latest xml in any case
  fetchPromiseList.push(createFetchPromise(filename));
}
if (parseSuccess) {
  renderGui();
} else {
  Promise.all(fetchPromiseList)
    .then(renderGui);
}

function renderGui() {
  /** @type NodeListOf<HTMLElement> */
  let allHomematicDeviceDivs = document.querySelectorAll('[data-hm-adress]');
  /** @type NodeListOf<HTMLElement> */
  let allHomematicSysvarDivs = document.querySelectorAll('[data-hm-sysvar]');

  for (const homematicDeviceDiv of allHomematicDeviceDivs) {
    const deviceBaseadress = homematicDeviceDiv.dataset.hmAdress;
    let overrideIndex = homematicDeviceDiv.dataset.hmOverrideIndex;
    let overrideDatapointTypeArr = homematicDeviceDiv.dataset.hmDatapointType?.split('|');
    let overrideDatapointTypeLabelArr = homematicDeviceDiv.dataset.hmDatapointTypeLabel?.split('|');
    let datapointType;
    let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType, overrideIndex);
    let labelDiv = document.createElement('div');
    labelDiv.classList.add('label');
    labelDiv.innerText = deviceInfo.device.deviceName;
    homematicDeviceDiv.appendChild(labelDiv);
    //homematicDiv.appendChild(document.createTextNode(deviceInfo.deviceName));
    homematicDeviceDiv.title = deviceInfo.device.type;
    homematicDeviceDiv.classList.add(deviceInfo.device.type);
    /** @type string|undefined */
    switch (deviceInfo.device.type) {
      case 'HmIP-FROLL': // Shutter actuator - flush mount
        {
          datapointType = 'LEVEL';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType, overrideIndex);
          if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
            homematicDeviceDiv.appendChild(createButton('Hoch', '1', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('Halb', '0.5', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('80%', '0.2', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('Runter', '0', deviceInfo.firstActorChannel.iseId));
          }
          // Actual level is in first level datapoint (SHUTTER_TRANSMITTER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value)) {
              homematicDeviceDiv.style.background = 'repeating-linear-gradient(-55deg,#a0a0a0,#a0a0a0 10px,white 10px,white 20px)';
            } else if (value == 0) {
              homematicDeviceDiv.style.background = 'gray';
            } else {
              homematicDeviceDiv.style.background = 'linear-gradient(0deg, #A3FF00 ' + ((value) * (100 / 100)) * 100 + '%, gray 0)'
            }
          });

          break;
        }
      case 'HmIP-BROLL': // Shutter actuator for Brand Switch Systems
        {
          datapointType = 'LEVEL';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType, overrideIndex);
          if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
            homematicDeviceDiv.appendChild(createButton('Hoch', '1', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('Halb', '0.6', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('Streifen', '0.22', deviceInfo.firstActorChannel.iseId));
            homematicDeviceDiv.appendChild(createButton('Runter', '0', deviceInfo.firstActorChannel.iseId));
          }
          // Actual level is in first level datapoint (SHUTTER_TRANSMITTER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value)) {
              homematicDeviceDiv.style.backgroundImage = 'repeating-linear-gradient(-55deg,#f5c7c7,#f5c7c7 10px,white 10px,white 20px)';
              homematicDeviceDiv.style.backgroundColor = '';
            } else if (value == 0) {
              homematicDeviceDiv.style.backgroundImage = '';
              homematicDeviceDiv.style.backgroundColor = 'gray';
            } else if (value <= 0.22) {
              homematicDeviceDiv.style.backgroundImage = 'repeating-linear-gradient(gray, gray 20px, #A3FF00 20px, #A3FF00 25px)';
              homematicDeviceDiv.style.backgroundColor = '';
            } else {
              homematicDeviceDiv.style.backgroundImage = 'linear-gradient(0deg, #A3FF00 ' + ((value - 0.22) * (100 / 78)) * 100 + '%, gray 0)'
              homematicDeviceDiv.style.backgroundColor = '';
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
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
            // Main actor state is in second state datapoint (SWITCH_VIRTUAL_RECEIVER)
            homematicDeviceDiv.appendChild(createButton('An', 'true', deviceInfo.selectedDatapoints[1].iseId));
            homematicDeviceDiv.appendChild(createButton('Aus', 'false', deviceInfo.selectedDatapoints[1].iseId));
          }
          // Actual state is in first state datapoint (SWITCH_TRANSMITTER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            homematicDeviceDiv.classList.toggle('hm-power-state-on', valueStr === 'true');
            homematicDeviceDiv.classList.toggle('hm-power-state-off', valueStr === 'false');
          });
          break;
        }
      case 'HmIP-SRH':  // Window Handle Sensor
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          // Actual state is in first state datapoint (ROTARY_HANDLE_TRANSCEIVER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            homematicDeviceDiv.classList.toggle('hm-position-closed', valueStr === '0');
            homematicDeviceDiv.classList.toggle('hm-position-tilted', valueStr === '1');
            homematicDeviceDiv.classList.toggle('hm-position-open', valueStr === '2');
          });
          break;
        }
      case 'HMIP-SWDO': // Wireless Window/Door Sensor (optic)
      case 'HmIP-SWDO-I': // Wireless Window/Door Sensor integrated
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          // Actual state is in first state datapoint (SHUTTER_CONTACT_TRANSCEIVER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            homematicDeviceDiv.classList.toggle('hm-position-closed', valueStr === '0');
            homematicDeviceDiv.classList.toggle('hm-position-open', valueStr === '1');
          });
          break;
        }
      case 'HmIP-SWD': // Watersensor
        {
          datapointType = 'WATERLEVEL_DETECTED';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          // Actual water is in first state datapoint (WATER_DETECTION_TRANSMITTER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            homematicDeviceDiv.classList.toggle('hm-water-idle', valueStr === 'false');
            homematicDeviceDiv.classList.toggle('hm-water-detected', valueStr === 'true');
          });
          datapointType = 'MOISTURE_DETECTED';
           deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
           // Actual moisture is in first state datapoint (WATER_DETECTION_TRANSMITTER)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            homematicDeviceDiv.classList.toggle('hm-moisture-idle', valueStr === 'false');
            homematicDeviceDiv.classList.toggle('hm-moisture-detected', valueStr === 'true');
          });
          break;
        }
      case 'HmIP-SWSD': // Smoke Detektor
        {
          datapointType = 'SMOKE_DETECTOR_ALARM_STATUS';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          // Actual smoke is in first state datapoint (SMOKE_DETECTOR)
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            alarmOffBtn.style.display='';
            if (valueStr === '0') {
              // Idle Off
              alarmOffBtn.style.display='none';
            }
            homematicDeviceDiv.classList.toggle('hm-smoke-idle', valueStr === '0'); // Idle off
            homematicDeviceDiv.classList.toggle('hm-smoke-primary', valueStr === '1'); // Primary (own) Alarm
            homematicDeviceDiv.classList.toggle('hm-smoke-secondary', valueStr === '3'); // Secondary (remote) Alarm
            homematicDeviceDiv.classList.toggle('hm-smoke-intrusion', valueStr === '2'); // Intrusion Detection
          });
          let detectorCommand = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, 'SMOKE_DETECTOR_COMMAND');
          let alarmOffBtn = homematicDeviceDiv.appendChild(createButton('Alarm aus', '0', detectorCommand.selectedDatapoints[0].iseId));
          // let testBtn = homematicDiv.appendChild(createButton('Test', '3', detectorCommand.selectedDatapoints[0].iseId));
          break;
        }
      case 'HmIP-KRC4': // Keyring Remote Control - 4 Buttons
        {
          // Has magic in CSS
          break;
        }
      case 'HmIP-BSL': // Switch actuator for brand switches – with Signal Lamp
        {
          const hmIpBslColorMap = [
            'gray',
            'BLUE',
            'GREEN',
            'TURQUOISE',
            'RED',
            'PURPLE',
            'YELLOW',
            'WHITE'
          ];

          datapointType = 'COLOR';
          let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);

          let bslTop = document.createElement('div');
          bslTop.style.cssText = 'height: 1em;border: 1px solid black;padding: 0px;margin: 0;';
          homematicDeviceDiv.appendChild(bslTop);
          // top DIMMER_TRANSMITTER is first COLOR
          addHmMonitoring(deviceInfo.selectedDatapoints[0].iseId, (valueStr) => {
            bslTop.style.backgroundColor = hmIpBslColorMap[valueStr];
          });
          let bslBottom = document.createElement('div');
          bslBottom.style.cssText = 'height: 1em;border: 1px solid black;padding: 0px;margin: 0;';
          homematicDeviceDiv.appendChild(bslBottom);
          // bottom DIMMER_TRANSMITTER is fifth COLOR
          addHmMonitoring(deviceInfo.selectedDatapoints[4].iseId, (valueStr) => {
            bslBottom.style.backgroundColor = hmIpBslColorMap[valueStr];
          });

          datapointType = 'LEVEL';
          let deviceInfoLevel = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, datapointType);
          // top DIMMER_TRANSMITTER is first LEVEL
          addHmMonitoring(deviceInfoLevel.selectedDatapoints[0].iseId, (valueStr) => {
            // bslTop.style.opacity = valueStr;
          });
          // bottom DIMMER_TRANSMITTER is fifth LEVEL
          addHmMonitoring(deviceInfoLevel.selectedDatapoints[4].iseId, (valueStr) => {
            // bslBottom.style.opacity = valueStr;
          });

          break;
        }
      case 'HmIP-RCV-50':
        {
          // Special
          if (!overrideDatapointTypeArr) {
            homematicDeviceDiv.firstChild.nodeValue = 'missing datapoint info';
            break;
          }
          for (let i = 0; i < overrideDatapointTypeArr.length; i++) {
            let deviceInfo = getDeviceInfo(homematicDeviceDiv.dataset.hmAdress, overrideDatapointTypeArr[i], overrideIndex);
            if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
              homematicDeviceDiv.appendChild(createButton(overrideDatapointTypeLabelArr[i], '1', deviceInfo.selectedDatapoints[0].iseId));
            }
            homematicDeviceDiv.firstElementChild.firstChild.nodeValue = deviceInfo.selectedDatapoints[0].name;
          }
          break;
        }
      default:
        {
          const errorDiv = document.createElement('div');
          errorDiv.innerHTML = 'Aktor des Typs <span style="color:red;">' + deviceInfo.device.type + '</span> nicht bekannt.';
          homematicDeviceDiv.appendChild(errorDiv);
          break;
        }
    }
    addHmMonitoring(deviceInfo.device.unreachableIseId, (valueStr) => {
      homematicDeviceDiv.classList.toggle('hm-unreachable', valueStr === 'true');
    });
    addHmMonitoring(deviceInfo.device.sabotageIseId, (valueStr) => {
      homematicDeviceDiv.classList.toggle('hm-sabotage', valueStr === 'true');
    });
    if (deviceInfo.batteryDatapoint.lowBatIseId) {
      let oldLowBatStr, oldOpVoltStr;
      let opVoltDiv = document.createElement('div');
      opVoltDiv.classList.add('opVolt');
      homematicDeviceDiv.appendChild(opVoltDiv);
      addHmMonitoring(deviceInfo.batteryDatapoint.lowBatIseId, (valueStr) => {
        if (valueStr === oldLowBatStr) {
          return;
        }
        oldLowBatStr = valueStr;
        homematicDeviceDiv.classList.toggle('hm-low-bat', valueStr === 'true');
        homematicDeviceDiv.classList.toggle('hm-full-bat', valueStr !== 'true');
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
      homematicDeviceDiv.appendChild(powerDiv);
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
    if (false && deviceInfo.weekProgramm.iseId) {
      let oldWeekStr;
      let weekDiv = document.createElement('span');
      weekDiv.innerText = String.fromCharCode(0xD83D, 0xDCC5);
      weekDiv.classList.add('hm-week-program-icon');
      labelDiv.append(' ', weekDiv);
      addHmMonitoring(deviceInfo.weekProgramm.iseId, (valueStr) => {
        if (valueStr === oldWeekStr) {
          return;
        }
        oldWeekStr = valueStr;
        weekDiv.setAttribute('hm-week-program-lock', valueStr);
      });
    }
  }

  for (const homematicSysvarDiv of allHomematicSysvarDivs) {
    const systemVariable = getDeviceSysinfo(homematicSysvarDiv.dataset.hmSysvar);
    if (systemVariable) {
      let labelDiv = document.createElement('div');
      labelDiv.classList.add('label');
      labelDiv.innerText = systemVariable.getAttribute('name');
      homematicSysvarDiv.append(
        labelDiv
      );
      switch (systemVariable.getAttribute('type')) {
        case '2': /** boolean */
          {
            let oldValue;
            let sysvarButtonFalse = createButton(systemVariable.getAttribute('value_name_0'), 'false', systemVariable.getAttribute('ise_id'));
            sysvarButtonFalse.disabled = homematicSysvarDiv.dataset.hmReadonly !== undefined;
            sysvarButtonFalse.classList.add('hm-sysvar-label', 'hm-sysvar-boolean')
            let sysvarButtonTrue = createButton(systemVariable.getAttribute('value_name_1'), 'true', systemVariable.getAttribute('ise_id'));
            sysvarButtonTrue.disabled = homematicSysvarDiv.dataset.hmReadonly !== undefined;
            sysvarButtonTrue.classList.add('hm-sysvar-label', 'hm-sysvar-boolean')
            homematicSysvarDiv.append(sysvarButtonFalse, sysvarButtonTrue);
            addHmMonitoring(systemVariable.getAttribute('ise_id'), (valueStr) => {
              if (valueStr === oldValue) {
                return;
              }
              oldValue = valueStr;
              if (valueStr === 'true') {
                sysvarButtonTrue.classList.add('hm-selected');
                sysvarButtonFalse.classList.remove('hm-selected');
              } else if (valueStr === 'false') {
                sysvarButtonTrue.classList.remove('hm-selected')
                sysvarButtonFalse.classList.add('hm-selected')
              }
            });

            break;
            let sysvarLabelTrue = document.createElement('label');
            sysvarLabelTrue.classList.add('hm-sysvar-label', 'hm-sysvar-boolean')
            let sysvarInputTrue = document.createElement('input');
            sysvarInputTrue.type = 'radio';
            sysvarInputTrue.addEventListener('change', evt => {
              setHomematicValue(systemVariable.getAttribute('ise_id'), 'true');
              sysvarInputTrue.disabled = true;
              sysvarInputFalse.disabled = true;
            });
            let textTrue = document.createElement('div');
            textTrue.textContent = systemVariable.getAttribute('value_name_1');
            sysvarLabelTrue.append(sysvarInputTrue, textTrue);

            let sysvarLabelFalse = document.createElement('label');
            sysvarLabelFalse.classList.add('hm-sysvar-label', 'hm-sysvar-boolean')
            let sysvarInputFalse = document.createElement('input');
            sysvarInputFalse.type = 'radio';
            sysvarInputFalse.addEventListener('change', evt => {
              setHomematicValue(systemVariable.getAttribute('ise_id'), 'false');
              sysvarInputTrue.disabled = true;
              sysvarInputFalse.disabled = true;
            });
            let textFalse = document.createElement('div');
            textFalse.textContent = systemVariable.getAttribute('value_name_0');
            sysvarLabelFalse.append(sysvarInputFalse, textFalse);

            homematicSysvarDiv.append(sysvarLabelTrue, sysvarLabelFalse)

            addHmMonitoring(systemVariable.getAttribute('ise_id'), (valueStr) => {
              if (valueStr === oldValue) {
                return;
              }
              oldValue = valueStr;
              if (valueStr === 'true') {
                sysvarInputTrue.checked = true;
                sysvarInputFalse.checked = false;
              } else if (valueStr === 'false') {
                sysvarInputTrue.checked = false;
                sysvarInputFalse.checked = true;
              }
              sysvarInputTrue.disabled = false;
              sysvarInputFalse.disabled = false;
            });
          }
          break;
        case '4': /** number */
          {
            const sysvarMeter = document.createElement('meter');
            sysvarMeter.setAttribute('min', systemVariable.getAttribute('min'));
            sysvarMeter.setAttribute('max', systemVariable.getAttribute('max'));
            let valueSpan = document.createElement('span');
            homematicSysvarDiv.append(sysvarMeter, valueSpan);
            let oldValue;
            addHmMonitoring(systemVariable.getAttribute('ise_id'), (valueStr) => {
              if (valueStr === oldValue) {
                return;
              }
              oldValue = valueStr;
              let value = parseFloat(valueStr);
              if (isNaN(value)) {
                sysvarMeter.value = 0;
              } else {
                sysvarMeter.value = value;
                homematicSysvarDiv.title = value.toLocaleString(undefined, {
                  //minimumFractionDigits: 1
                }) + systemVariable.getAttribute('unit');
                valueSpan.innerText = homematicSysvarDiv.title;
              }
            });
          }
          break;
      }
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
  let deviceList_deviceNode = cachedDocuments.get('devicelist')?.querySelector(
    'device[address="' + hmAdress + '"]'
  );
  let deviceIse = deviceList_deviceNode?.getAttribute('ise_id');
  let firstActorChannelNode = deviceList_deviceNode?.querySelector('channel[direction="RECEIVER"][visible="true"]');
  let firstActorChannelIndex = firstActorChannelNode?.getAttribute('index') ?? overrideIndex;

  let stateList_deviceNode = cachedDocuments.get('statelist')?.querySelector(
    'device[ise_id="' + deviceIse + '"]'
  );

  let selectedDatapointNodes;
  /**@type{{
        iseId: string;
        name: string;
      }[]} */
  let selectedDatapointNodeArray = [];
  if (datapointType) {
    selectedDatapointNodes =
      stateList_deviceNode?.querySelectorAll('datapoint[type="' + datapointType + '"]');
    selectedDatapointNodes.forEach(data => {
      selectedDatapointNodeArray.push({
        iseId: data?.getAttribute('ise_id'),
        name: data?.parentElement?.getAttribute('name')
      })
    });
  }
  let powerDatapointNode =
    stateList_deviceNode?.querySelector('datapoint[type="' + 'POWER' + '"]');
  let tempDatapointNode =
    stateList_deviceNode?.querySelector('datapoint[type="' + 'ACTUAL_TEMPERATURE' + '"]');
  let lowBatDatapointNode =
    stateList_deviceNode?.querySelector('datapoint[type="' + 'LOW_BAT' + '"]');
  let opVoltDatapointNode =
    stateList_deviceNode?.querySelector('datapoint[type="' + 'OPERATING_VOLTAGE' + '"]');
  let weekProgramLockDatapointNode =
    stateList_deviceNode?.querySelector('datapoint[type="' + 'WEEK_PROGRAM_CHANNEL_LOCKS' + '"]');
  return {
    device: {
      type: deviceList_deviceNode?.getAttribute('device_type'),
      deviceName: deviceList_deviceNode?.getAttribute('name'),
      unreachableIseId: stateList_deviceNode?.querySelector('datapoint[type="UNREACH"]')?.getAttribute('ise_id'),
      sabotageIseId: stateList_deviceNode?.querySelector('datapoint[type="SABOTAGE"]')?.getAttribute('ise_id'),
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
    },
    weekProgramm: {
      iseId:
        weekProgramLockDatapointNode?.parentElement.getAttribute('visible') === 'true'
          ? weekProgramLockDatapointNode?.getAttribute('ise_id')
          : undefined
    }
  };
}

function getDeviceSysinfo(/** @type string */ name) {
  /** @type Element |undefined */
  let result;
  const systemVariables = cachedDocuments.get('sysvarlist')?.querySelectorAll('systemVariable');
  systemVariables?.forEach(elem => {
    if (elem.getAttribute('name') === name) {
      result = elem;
    }
  });
  return result;
}

/**
 * @param {MouseEvent} evt
 * @this {HTMLButtonElement}
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
    target.value
  )
    .then(doc => {
      outputFnc('Success in writing value: ' + (doc? doc.firstElementChild?.firstElementChild?.getAttribute('new_value'):'') + ', to ise id: ' + (doc? doc.firstElementChild?.firstElementChild?.getAttribute('id'):''), 'color: green;');
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
  button.value = value;
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
  return urlToDoc(
    host + baseXMLAPIpath + 'statechange.cgi'
    + '?' + 'ise_id=' + ise_id.join(',')
    + '&' + 'new_value=' + value.join(',')
  );
}

/**
 *
 * @param {string[]} iseIds
 */
function getMultipleHomematicValue(iseIds) {
  return urlToDoc(host + baseXMLAPIpath + 'state.cgi' + '?' + 'datapoint_id=' + iseIds.join(','))
    .then(doc => {
      /**@type {Map<string, string>} */
      let valueMap = new Map();
      iseIds.forEach(id => {
        valueMap.set(id, doc.querySelector('datapoint[ise_id="' + id + '"]')?.getAttribute('value'));
      });
      return valueMap;
    })
    .catch(ex => {
      // ignore errors
      // console.error(ex);
      return new Map();
      //throw ex; //new Error('Unexpected error');
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
  return urlToDoc(host + baseXMLAPIpath + 'state.cgi' + '?' + 'datapoint_id=' + ise_id)
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
  if (
    monitorList.size &&
    navigator.onLine &&
    document.visibilityState === 'visible'
  ) {
    getMultipleHomematicValue(Array.from(monitorList.keys()))
      .then(resultMap => {
        resultMap?.forEach((hmValue, iseId) => {
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

let notificationContainer = document.getElementsByClassName('notification')[0];
let hmFetchNotification = function () {
  urlToDoc(host + baseXMLAPIpath + 'systemNotification.cgi')
    .then(doc => {
      notificationContainer.textContent = '';
      let systemNotifications = doc.querySelectorAll('systemNotification > notification');
      systemNotifications.forEach(elem => {
        let notificationDiv = document.createElement('div');
        let iseId = elem.getAttribute('ise_id');
        switch (elem.getAttribute('type')) {
          case 'SABOTAGE':
            let deviceName = cachedDocuments
              .get('statelist')
              ?.querySelector('[ise_id="' + iseId + '"]')
              ?.closest('device')
              ?.getAttribute('name') ?? 'Unbekanntes Gerät';
            notificationDiv.append('Sabotage-Alarm für: ' + deviceName);
            notificationDiv.classList.add('hm-sabotage');
            break;
          default:
            notificationDiv.append('Unsupported system notification for type ' + elem.getAttribute('type'));
        }
        notificationContainer.appendChild(notificationDiv);
      });
      if (systemNotifications.length) {
        let confirmButton = document.createElement('button');
        confirmButton.innerHTML = 'Bestätigen';
        confirmButton.addEventListener('click', evt => {
          return urlToDoc(host + baseXMLAPIpath + 'systemNotificationClear.cgi')
           ;
        });
        notificationContainer.append(confirmButton);
      }
    })
    ;

  setTimeout(hmFetchNotification, 3000);
};
hmFetchNotification();

if ('wakeLock' in navigator) {
/** @type {null | EventTarget & {release:()=>{}}} */
  let wakeLock = null;

  let wakeLockCheckbox = document.createElement('input');
  wakeLockCheckbox.type = 'checkbox';

  let labelelem = document.createElement('label');
  labelelem.append(wakeLockCheckbox, 'Bildschirm aktiv halten');
  document.body.appendChild(labelelem);

  wakeLockCheckbox.addEventListener('change', evt => {

    let checkbox = /** @type {HTMLInputElement} */(event.target);
    if (checkbox.checked) {

      navigator['wakeLock'].request('screen')
        .then(data => {
          wakeLock = data;
          wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock was released');
            checkbox.checked = false;
          });
          console.log('Screen Wake Lock is active');
        })
        .catch(err => {
          console.error(`${err.name}, ${err.message}`);
        }
        );
    } else {
      wakeLock?.release();
      wakeLock = null;
    }
  });
}
