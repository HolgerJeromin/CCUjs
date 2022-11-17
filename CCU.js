const host =
  "//" + (document.body.dataset.hmXmlapiHost ?? window.location.host);
const baseXMLAPIpath = "/addons/xmlapi/";

/** @typedef  {  'devicelist'|'statelist'|'sysvarlist'} configFilenameList */
/** @type configFilenameList[] */
const configFilenameList = ["devicelist", "statelist", "sysvarlist"];
/** Mapping from list name to url
 *  @type Map<configFilenameList, string> */
const configUrlMap = new Map();
for (const name of configFilenameList) {
  configUrlMap.set(name, host + baseXMLAPIpath + name + ".cgi");
}

/** @type {Map<configFilenameList,document>} */
const cachedDocuments = new Map();

const DomParser = new window.DOMParser();
const isoTextdecoder = new TextDecoder("iso-8859-15");
const outputElem = document.getElementById("output");

/** key is the iseId
 * @type {Map<string, Set<(hmValue: string)=>void>>} */
const monitorList = new Map();

/**
 *
 * @param {string|object} message
 * @param {string} cssText
 */
const outputFnc = (message, cssText = "") => {
  outputElem.innerHTML = message;
  outputElem.style.cssText = cssText;
};

outputFnc("loading...");

/**
 *
 * @param {string} xmlString
 */
const stringToDocument = (xmlString) => {
  return DomParser.parseFromString(xmlString, "text/xml");
};
let newWindowOpened = false;
function urlToString(url) {
  return fetch(url)
    .then((response) => {
      if (response && response.ok) {
        return response.arrayBuffer();
      } else {
        return Promise.reject(new Error("Something went wrong in the request"));
      }
    })
    .then((arrayBuffer) => {
      const decodedString = isoTextdecoder.decode(new DataView(arrayBuffer));
      return decodedString;
    })
    .catch((ex) => {
      console.error(ex);
      if (ex instanceof TypeError) {
        let isConfigUrl = false;
        for (const configUrl of configUrlMap.values()) {
          if (configUrl === url) {
            isConfigUrl = true;
            break;
          }
        }
        if (!newWindowOpened && isConfigUrl) {
          alert(
            "Erlaube Zugriff in dem folgendem Aufruf und geh dann zurück zu dieser App."
          );
          let anchorElem = document.createElement("a");
          anchorElem.href = url;
          anchorElem.target = "xmlapiCheck";
          document.body?.append(anchorElem);
          anchorElem.click();
          anchorElem.remove();
          newWindowOpened = true;
        }
        outputFnc(
          "Error in request(parsing): " +
            ex +
            '<br>You could try to open the <a target="_blank" href="' +
            url +
            '">url</a> manually.',
          "color: red;"
        );
      } else {
        outputFnc("Error in request(parsing): " + ex, "color: red;");
      }
    });
}
function urlToDoc(url) {
  return urlToString(url).then(stringToDocument);
}
const createFetchPromise = (/** @type configFilenameList */ filename) => {
  return urlToString(configUrlMap.get(filename))
    .then((str) => {
      if (!str) {
        return Promise.reject(new Error("Got no url data for " + filename));
      }
      try {
        window.localStorage.setItem(filename, str);
      } catch (error) {
        // skip
      }
      return str;
    })
    .then(stringToDocument)
    .then((doc) => {
      return cachedDocuments.set(filename, doc);
    })
    .catch((ex) => {
      outputFnc("Error in request(parsing): " + ex, "color: red;");
    });
};
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
  Promise.all(fetchPromiseList).then(renderGui);
}

function renderGui() {
  /** @type NodeListOf<HTMLElement> */
  let allHomematicDeviceDivs = document.querySelectorAll("[data-hm-address]");
  /** @type NodeListOf<HTMLElement> */
  let allHomematicSysvarDivs = document.querySelectorAll("[data-hm-sysvar]");

  for (const homematicDeviceDiv of allHomematicDeviceDivs) {
    const hmAddress = homematicDeviceDiv.dataset.hmAddress;
    let overrideIndex = homematicDeviceDiv.dataset.hmOverrideIndex;
    let subdevice = parseInt(homematicDeviceDiv.dataset.hmSubdevice) || 0;
    /** Index to use. Default "use first" */
    let channelIndex = parseInt(homematicDeviceDiv.dataset.hmChannelIndex) || 0;
    let overrideDatapointTypeArr =
      homematicDeviceDiv.dataset.hmDatapointType?.split("|");
    let overrideDatapointTypeLabelArr =
      homematicDeviceDiv.dataset.hmDatapointTypeLabel?.split("|");
    let datapointType;
    let deviceInfo = getDeviceInfo(hmAddress, datapointType, overrideIndex);
    let labelDiv = document.createElement("div");
    labelDiv.classList.add("label");
    homematicDeviceDiv.appendChild(labelDiv);

    if (!cachedDocuments.size) {
      labelDiv.innerText = "Keine Geräte-Daten bekannt";
      continue;
    } else if (homematicDeviceDiv.dataset.hmChannelIndex !== undefined) {
      // Override device name when requested explicit channel
      labelDiv.innerText = deviceInfo.receiver.filter((channel) => {
        // Find STATE channel
        return channel.type === "26";
      })[channelIndex].name;
    } else {
      // Use device name for label
      labelDiv.innerText = deviceInfo.device.deviceName;
    }
    //homematicDiv.appendChild(document.createTextNode(deviceInfo.deviceName));
    homematicDeviceDiv.title = deviceInfo.device.type;
    homematicDeviceDiv.classList.add(deviceInfo.device.type);
    switch (deviceInfo.device.type) {
      case "HmIP-DRDI3": /* Dimming Actuator for DIN rail mount – 3 channels  */ {
        datapointType = "LEVEL";
        let levelDeviceInfo = getDeviceInfo(
          hmAddress,
          datapointType,
          overrideIndex
        );
        // Since DRDI3 consists of 3 subdevices - we use sub-device offset to find out which subdevices to use
        // valid subdevice values are 0, 1, 2. Those are mapped to datapoints 1, 5, and 9, corresponding to channels :5, :9, :13
        // Note: findActorChannel heuristic does not work for this device
        let actuatorChannelDatapointIndex = subdevice * 4 + 1;
        if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
          homematicDeviceDiv.appendChild(
            createButton(
              "100%",
              "1",
              levelDeviceInfo.selectedDatapoints[actuatorChannelDatapointIndex]
                .iseId
            )
          );
          homematicDeviceDiv.appendChild(
            createButton(
              "60%",
              "0.6",
              levelDeviceInfo.selectedDatapoints[actuatorChannelDatapointIndex]
                .iseId
            )
          );
          homematicDeviceDiv.appendChild(
            createButton(
              "30%",
              "0.3",
              levelDeviceInfo.selectedDatapoints[actuatorChannelDatapointIndex]
                .iseId
            )
          );
          homematicDeviceDiv.appendChild(
            createButton(
              "0%",
              "0",
              levelDeviceInfo.selectedDatapoints[actuatorChannelDatapointIndex]
                .iseId
            )
          );
          // Override device name with actuator channel name
          labelDiv.innerText =
            levelDeviceInfo.selectedDatapoints[
              actuatorChannelDatapointIndex
            ].name;
        }
        let valueDiv = document.createElement("div");
        valueDiv.classList.add("currentValue");
        homematicDeviceDiv.appendChild(valueDiv);
        // Todo adjust channel wise mapping
        addHmMonitoring(
          levelDeviceInfo.selectedDatapoints[actuatorChannelDatapointIndex]
            .iseId,
          (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value) || value == 0) {
              homematicDeviceDiv.classList.toggle("hm-channel-state-on", false);
              homematicDeviceDiv.classList.toggle("hm-channel-state-off", true);
              valueDiv.innerText = "0";
            } else {
              homematicDeviceDiv.classList.toggle("hm-channel-state-on", true);
              homematicDeviceDiv.classList.toggle(
                "hm-channel-state-off",
                false
              );
              valueDiv.innerText = value.toString();
            }
          }
        );

        break;
      }
      case "HmIP-eTRV-C-2": /* Radiator thermostat – compact-2 */ {
        {
          datapointType = "SET_POINT_TEMPERATURE";
          let levelDeviceInfo = getDeviceInfo(
            hmAddress,
            datapointType,
            overrideIndex
          );
          var setpointDiv = document.createElement("div");
          setpointDiv.classList.add("currentValue");
          homematicDeviceDiv.appendChild(setpointDiv);
          addHmMonitoring(
            levelDeviceInfo.selectedDatapoints[0].iseId,
            (valueStr) => {
              let value = parseFloat(valueStr);
              if (isNaN(value) || value == 0) {
                setpointDiv.innerText = "Sollwert: 0 °C";
              } else {
                setpointDiv.innerText = "Sollwert: " + value.toString() + " °C";
              }
            }
          );
        }
        {
          datapointType = "LEVEL";
          let levelDeviceInfo = getDeviceInfo(
            hmAddress,
            datapointType,
            overrideIndex
          );
          let valueDiv = document.createElement("div");
          valueDiv.classList.add("currentValue");
          homematicDeviceDiv.appendChild(valueDiv);
          console.log(levelDeviceInfo);
          addHmMonitoring(levelDeviceInfo.tempDatapoint.iseId, (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value) || value == 0) {
              valueDiv.innerText = "Messwert: 0 °C";
            } else {
              valueDiv.innerText = "Messwert: " + value.toString() + " °C";
            }
          });
          var actorDiv = document.createElement("div");
          actorDiv.classList.add("currentValue");
          homematicDeviceDiv.appendChild(actorDiv);
          // Todo adjust channel wise mapping
          addHmMonitoring(
            levelDeviceInfo.selectedDatapoints[0].iseId,
            (valueStr) => {
              let value = parseFloat(valueStr);
              if (isNaN(value) || value == 0) {
                actorDiv.innerText = "Ventilstellung: 0 %";
              } else {
                homematicDeviceDiv.style.background =
                  "rgba(255, 255, 0, " + (value + 0.1).toString() + ")";
                actorDiv.innerText =
                  "Ventilstellung: " + (value * 100).toString() + "%";
              }
              homematicDeviceDiv.classList.toggle(
                "hm-channel-state-off",
                value === 0
              );
              homematicDeviceDiv.classList.toggle(
                "hm-channel-state-on",
                value != 0
              );
            }
          );
        }
        break;
      }
      case "HmIP-FROLL": /* Shutter actuator - flush mount */
      case "HmIP-BROLL": /* Shutter actuator for Brand Switch Systems */ {
        datapointType = "LEVEL";
        const channelLevelDatapointId = deviceInfo.receiver
          .filter((channel) => {
            // Find STATE channel
            return channel.type === "17";
          })
          [channelIndex]?.datapoints.find(
            // Find first readwrite datapoint
            (datapoint) =>
              datapoint.type === "LEVEL" && datapoint.operations === "7"
          ).iseId;
        if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
          homematicDeviceDiv.appendChild(
            createButton("Hoch", "1", channelLevelDatapointId)
          );
          if (homematicDeviceDiv.dataset.hmSafeStateOnly === undefined) {
            homematicDeviceDiv.appendChild(
              createButton(
                "Stop",
                "1",
                deviceInfo.receiver
                  .filter((channel) => {
                    // Find STATE channel
                    return channel.type === "17";
                  })
                  [channelIndex]?.datapoints.find(
                    // Find first readwrite datapoint
                    (datapoint) =>
                      datapoint.type === "STOP" && datapoint.operations === "2"
                  ).iseId,
                ["hm-safe"]
              )
            );
            if (homematicDeviceDiv.dataset.deviceType === "sunblind") {
              homematicDeviceDiv.appendChild(
                createButton("Halb", "0.5", channelLevelDatapointId)
              );
            } else {
              homematicDeviceDiv.appendChild(
                createButton("Streifen", "0.22", channelLevelDatapointId, [
                  "hm-unsafe",
                ])
              );
            }
            homematicDeviceDiv.appendChild(
              createButton("Runter", "0", channelLevelDatapointId, [
                "hm-unsafe",
              ])
            );
          }
        }
        // Actual level is in first level datapoint (SHUTTER_TRANSMITTER)
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "17";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "LEVEL" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            let value = parseFloat(valueStr);
            if (isNaN(value)) {
              homematicDeviceDiv.style.background =
                "repeating-linear-gradient(-55deg,#f5c7c7,#f5c7c7 10px,white 10px,white 20px)";
              homematicDeviceDiv.style.setProperty("--shutter-level", "");
            } else if (value == 0) {
              homematicDeviceDiv.style.background = "gray";
              homematicDeviceDiv.style.setProperty("--shutter-level", "");
            } else {
              if (homematicDeviceDiv.dataset.deviceType === "sunblind") {
                homematicDeviceDiv.style.background =
                  "linear-gradient(0deg, #A3FF00 " + value * 100 + "%, gray 0)";
                homematicDeviceDiv.style.setProperty(
                  "--shutter-level",
                  valueStr
                );
              } else {
                if (value <= 0.22) {
                  homematicDeviceDiv.style.background =
                    "repeating-linear-gradient(gray, gray 20px, #A3FF00 20px, #A3FF00 25px)";
                  homematicDeviceDiv.style.setProperty(
                    "--shutter-level",
                    valueStr
                  );
                } else {
                  homematicDeviceDiv.style.background =
                    "linear-gradient(0deg, #A3FF00 " +
                    (value - 0.22) * (100 / 78) * 100 +
                    "%, gray 0)";
                  homematicDeviceDiv.style.setProperty(
                    "--shutter-level",
                    valueStr
                  );
                }
              }
            }
          }
        );

        break;
      }
      case "HmIP-BSL": /* Switch actuator for brand switches – with Signal Lamp */ {
        const hmIpBslColorMap = [
          "gray",
          "BLUE",
          "GREEN",
          "TURQUOISE",
          "RED",
          "PURPLE",
          "YELLOW",
          "WHITE",
        ];

        let bslTop = document.createElement("div");
        bslTop.classList.add("topLed");
        bslTop.style.cssText =
          "height: 1em;border: 1px solid black;padding: 0px;margin: 0;background-color:var(--bslTopColor)";
        homematicDeviceDiv.appendChild(bslTop);
        // top DIMMER_TRANSMITTER is first COLOR
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "27";
            })[0]
            ?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "COLOR" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.style.setProperty(
              "--bslTopColor",
              hmIpBslColorMap[valueStr]
            );
          }
        );
        let bslBottom = document.createElement("div");
        bslBottom.classList.add("bottomLed");
        bslBottom.style.cssText =
          "height: 1em;border: 1px solid black;padding: 0px;margin: 0;background-color:var(--bslBottomColor)";
        homematicDeviceDiv.appendChild(bslBottom);
        // bottom DIMMER_TRANSMITTER is second COLOR
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "27";
            })[1]
            ?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "COLOR" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.style.setProperty(
              "--bslBottomColor",
              hmIpBslColorMap[valueStr]
            );
          }
        );
        // top DIMMER_TRANSMITTER is first LEVEL
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "27";
            })[0]
            ?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "LEVEL" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.style.setProperty(
              "--bslTopDimmervalue",
              valueStr
            );
          }
        );
        // bottom DIMMER_TRANSMITTER is second LEVEL
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "27";
            })[1]
            ?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "LEVEL" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.style.setProperty(
              "--bslBottomDimmervalue",
              valueStr
            );
          }
        );

        //break;
        // fall through
      }
      case "HMIP-PS": /* Pluggable Switch */
      case "HMIP-PS-2": /* Pluggable Switch */
      case "HMIP-PSM": /* Pluggable Switch with Measuring */
      case "HmIP-PSM-2": /* Pluggable Switch with Measuring */
      case "HmIP-FSM": /* Full flush switch actuator with Measuring */
      case "HmIP-BSM": /* Switch actuator with Measuring for Brand Switch Systems */
      case "HmIP-DRSI1": /* Switch actuator for DIN rail mount - 1 channel */
      case "HmIP-USBSM": {
        datapointType = "STATE";
        // Main actor state is in first state datapoint which has readwriteevent (SWITCH_VIRTUAL_RECEIVER)
        const channelStateDatapointId = deviceInfo.receiver
          .filter((channel) => {
            // Find STATE channel
            return channel.type === "26";
          })
          [channelIndex]?.datapoints.find(
            // Find first readwrite datapoint
            (datapoint) =>
              datapoint.type === "STATE" && datapoint.operations === "7"
          ).iseId;
        if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
          if (homematicDeviceDiv.dataset.hmSafeStateOnly === undefined) {
            homematicDeviceDiv.appendChild(
              createButton("An", "true", channelStateDatapointId, ["hm-unsafe"])
            );
          }
          homematicDeviceDiv.appendChild(
            createButton("Aus", "false", channelStateDatapointId)
          );
        }
        // Find channel status
        addHmMonitoring(channelStateDatapointId, (valueStr) => {
          homematicDeviceDiv.classList.toggle(
            "hm-channel-state-on",
            valueStr === "true"
          );
          homematicDeviceDiv.classList.toggle(
            "hm-channel-state-off",
            valueStr === "false"
          );
        });
        // Actual state is in first state datapoint which has readevent (SWITCH_TRANSMITTER)
        addHmMonitoring(
          deviceInfo.unknown
            .find((channel) => {
              // Find STATE channel
              return channel.type === "26";
            })
            ?.datapoints.find(
              // Find first read datapoint
              (datapoint) =>
                datapoint.type === "STATE" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.classList.toggle(
              "hm-power-state-on",
              valueStr === "true"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-power-state-off",
              valueStr === "false"
            );
          }
        );
        break;
      }
      case "HmIP-SRH": /* Window Handle Sensor */ {
        // Actual state is in first state datapoint (ROTARY_HANDLE_TRANSCEIVER)
        addHmMonitoring(
          deviceInfo.sender
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "17";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "STATE" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.classList.toggle(
              "hm-position-closed",
              valueStr === "0"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-position-tilted",
              valueStr === "1"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-position-open",
              valueStr === "2"
            );
          }
        );
        break;
      }
      case "HMIP-SWDO": /* Wireless Window/Door Sensor (optic) */
      case "HmIP-SWDO-I": /* Wireless Window/Door Sensor integrated */ {
        // Actual state is in first state datapoint (SHUTTER_CONTACT_TRANSCEIVER)
        addHmMonitoring(
          deviceInfo.sender
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "37";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "STATE" && datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.classList.toggle(
              "hm-position-closed",
              valueStr === "0"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-position-open",
              valueStr === "1"
            );
          }
        );
        break;
      }
      case "HmIP-SWD": /* Watersensor */ {
        // Actual water is in first state datapoint (WATER_DETECTION_TRANSMITTER)
        addHmMonitoring(
          deviceInfo.sender
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "17";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "WATERLEVEL_DETECTED" &&
                datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.classList.toggle(
              "hm-water-idle",
              valueStr === "false"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-water-detected",
              valueStr === "true"
            );
          }
        );
        // Actual moisture is in first state datapoint (WATER_DETECTION_TRANSMITTER)
        addHmMonitoring(
          deviceInfo.sender
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "17";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "MOISTURE_DETECTED" &&
                datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            homematicDeviceDiv.classList.toggle(
              "hm-moisture-idle",
              valueStr === "false"
            );
            homematicDeviceDiv.classList.toggle(
              "hm-moisture-detected",
              valueStr === "true"
            );
          }
        );
        break;
      }
      case "HmIP-SWSD": /* Smoke Detector */ {
        // Actual smoke is in first state datapoint (SMOKE_DETECTOR)
        addHmMonitoring(
          deviceInfo.unknown
            .filter((channel) => {
              // Find STATE channel
              return channel.type === "17";
            })
            [channelIndex]?.datapoints.find(
              // Find first readwrite datapoint
              (datapoint) =>
                datapoint.type === "SMOKE_DETECTOR_ALARM_STATUS" &&
                datapoint.operations === "5"
            ).iseId,
          (valueStr) => {
            alarmOffBtn.style.display = "";
            if (valueStr === "0") {
              // Idle Off
              alarmOffBtn.style.display = "none";
            }
            homematicDeviceDiv.classList.toggle(
              "hm-smoke-idle",
              valueStr === "0"
            ); // Idle off
            homematicDeviceDiv.classList.toggle(
              "hm-smoke-primary",
              valueStr === "1"
            ); // Primary (own) Alarm
            homematicDeviceDiv.classList.toggle(
              "hm-smoke-secondary",
              valueStr === "3"
            ); // Secondary (remote) Alarm
            homematicDeviceDiv.classList.toggle(
              "hm-smoke-intrusion",
              valueStr === "2"
            ); // Intrusion Detection
          }
        );
        let alarmOffBtn = homematicDeviceDiv.appendChild(
          createButton(
            "Alarm aus",
            "0",
            deviceInfo.unknown
              .filter((channel) => {
                // Find STATE channel
                return channel.type === "17";
              })
              [channelIndex]?.datapoints.find(
                // Find first readwrite datapoint
                (datapoint) =>
                  datapoint.type === "SMOKE_DETECTOR_COMMAND" &&
                  datapoint.operations === "2"
              ).iseId
          )
        );
        // let testBtn = homematicDiv.appendChild(createButton('Test', '3', detectorCommand.selectedDatapoints[0].iseId));
        break;
      }
      case "HmIP-KRC4": /* Keyring Remote Control - 4 Buttons */ {
        // Only uses generic classes in CSS
        break;
      }
      case "HmIP-RCV-50": {
        // Special
        if (!overrideDatapointTypeArr) {
          homematicDeviceDiv.firstChild.nodeValue = "missing datapoint info";
          break;
        }
        homematicDeviceDiv.style.background = "unset";
        for (let i = 0; i < overrideDatapointTypeArr.length; i++) {
          let deviceInfo = getDeviceInfo(
            hmAddress,
            overrideDatapointTypeArr[i],
            overrideIndex
          );
          if (homematicDeviceDiv.dataset.hmReadonly === undefined) {
            homematicDeviceDiv.appendChild(
              createButton(
                overrideDatapointTypeLabelArr[i],
                "1",
                deviceInfo.selectedDatapoints[overrideIndex].iseId
              )
            );
          }
          homematicDeviceDiv.firstElementChild.firstChild.nodeValue =
            deviceInfo.selectedDatapoints[overrideIndex].name;
        }
        break;
      }
      default: {
        const errorDiv = document.createElement("div");
        errorDiv.innerHTML =
          'Aktor des Typs <span style="color:red;">' +
          deviceInfo.device.type +
          "</span> nicht bekannt.";
        homematicDeviceDiv.appendChild(errorDiv);
        break;
      }
    }
    addHmMonitoring(deviceInfo.device.unreachableIseId, (valueStr) => {
      homematicDeviceDiv.classList.toggle(
        "hm-unreachable",
        valueStr === "true"
      );
    });
    addHmMonitoring(deviceInfo.device.sabotageIseId, (valueStr) => {
      homematicDeviceDiv.classList.toggle("hm-sabotage", valueStr === "true");
    });
    if (deviceInfo.batteryDatapoint.lowBatIseId) {
      let oldLowBatStr, oldOpVoltStr;
      let opVoltDiv = document.createElement("div");
      opVoltDiv.classList.add("opVolt");
      homematicDeviceDiv.appendChild(opVoltDiv);
      addHmMonitoring(deviceInfo.batteryDatapoint.lowBatIseId, (valueStr) => {
        if (valueStr === oldLowBatStr) {
          return;
        }
        oldLowBatStr = valueStr;
        homematicDeviceDiv.classList.toggle("hm-low-bat", valueStr === "true");
        homematicDeviceDiv.classList.toggle("hm-full-bat", valueStr !== "true");
      });
      addHmMonitoring(deviceInfo.batteryDatapoint.opVoltIseId, (valueStr) => {
        if (valueStr === oldOpVoltStr) {
          return;
        }
        oldOpVoltStr = valueStr;
        let opVolt = parseFloat(valueStr);
        if (!Number.isNaN(opVolt) && opVolt !== 0) {
          opVoltDiv.innerText =
            opVolt.toLocaleString(undefined, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }) + " V";
        }
      });
    }
    if (deviceInfo.power.iseId) {
      let oldPowerStr;
      let powerDiv = document.createElement("div");
      powerDiv.classList.add("power");
      homematicDeviceDiv.appendChild(powerDiv);
      addHmMonitoring(deviceInfo.power.iseId, (valueStr) => {
        if (valueStr === oldPowerStr) {
          return;
        }
        oldPowerStr = valueStr;
        let power = parseFloat(valueStr);
        if (!Number.isNaN(power)) {
          powerDiv.innerText =
            power.toLocaleString(undefined, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
            }) +
            " " +
            deviceInfo.power.valueunit;
        }
      });
    }
    if (false && deviceInfo.weekProgramm.iseId) {
      let oldWeekStr;
      let weekDiv = document.createElement("span");
      weekDiv.innerText = String.fromCharCode(0xd83d, 0xdcc5);
      weekDiv.classList.add("hm-week-program-icon");
      labelDiv.append(" ", weekDiv);
      addHmMonitoring(deviceInfo.weekProgramm.iseId, (valueStr) => {
        if (valueStr === oldWeekStr) {
          return;
        }
        oldWeekStr = valueStr;
        weekDiv.setAttribute("hm-week-program-lock", valueStr);
      });
    }
  }

  for (const homematicSysvarDiv of allHomematicSysvarDivs) {
    const systemVariable = getDeviceSysinfo(
      homematicSysvarDiv.dataset.hmSysvar
    );
    if (systemVariable) {
      let labelDiv = document.createElement("div");
      labelDiv.classList.add("label");
      labelDiv.innerText = systemVariable.getAttribute("name");
      homematicSysvarDiv.append(labelDiv);
      switch (systemVariable.getAttribute("type")) {
        case "2" /** boolean */:
          {
            let oldValue;
            let sysvarButtonFalse = createButton(
              systemVariable.getAttribute("value_name_0"),
              "false",
              systemVariable.getAttribute("ise_id")
            );
            sysvarButtonFalse.disabled =
              homematicSysvarDiv.dataset.hmReadonly !== undefined;
            sysvarButtonFalse.classList.add(
              "hm-sysvar-label",
              "hm-sysvar-boolean"
            );
            let sysvarButtonTrue = createButton(
              systemVariable.getAttribute("value_name_1"),
              "true",
              systemVariable.getAttribute("ise_id")
            );
            sysvarButtonTrue.disabled =
              homematicSysvarDiv.dataset.hmReadonly !== undefined;
            sysvarButtonTrue.classList.add(
              "hm-sysvar-label",
              "hm-sysvar-boolean"
            );
            homematicSysvarDiv.append(sysvarButtonFalse, sysvarButtonTrue);
            addHmMonitoring(
              systemVariable.getAttribute("ise_id"),
              (valueStr) => {
                if (valueStr === oldValue) {
                  return;
                }
                oldValue = valueStr;
                if (valueStr === "true") {
                  sysvarButtonTrue.classList.add("hm-selected");
                  sysvarButtonFalse.classList.remove("hm-selected");
                } else if (valueStr === "false") {
                  sysvarButtonTrue.classList.remove("hm-selected");
                  sysvarButtonFalse.classList.add("hm-selected");
                }
              }
            );
          }
          break;
        case "4" /** number */:
          {
            const sysvarMeter = document.createElement("meter");
            sysvarMeter.setAttribute("min", systemVariable.getAttribute("min"));
            sysvarMeter.setAttribute("max", systemVariable.getAttribute("max"));
            let valueSpan = document.createElement("span");
            homematicSysvarDiv.append(sysvarMeter, valueSpan);
            let oldValue;
            addHmMonitoring(
              systemVariable.getAttribute("ise_id"),
              (valueStr) => {
                if (valueStr === oldValue) {
                  return;
                }
                oldValue = valueStr;
                let value = parseFloat(valueStr);
                if (isNaN(value)) {
                  sysvarMeter.value = 0;
                } else {
                  sysvarMeter.value = value;
                  homematicSysvarDiv.title =
                    value.toLocaleString(undefined, {
                      //minimumFractionDigits: 1
                    }) + systemVariable.getAttribute("unit");
                  valueSpan.innerText = homematicSysvarDiv.title;
                }
              }
            );
          }
          break;
        case "16" /** Value list */:
          {
            let oldValue;
            let valueList = systemVariable
              .getAttribute("value_list")
              .split(";");
            for (let index = 0; index < valueList.length; index++) {
              let sysvarButton = createButton(
                valueList[index],
                index.toString(),
                systemVariable.getAttribute("ise_id")
              );
              sysvarButton.disabled =
                homematicSysvarDiv.dataset.hmReadonly !== undefined;
              sysvarButton.classList.add(
                "hm-sysvar-label",
                "hm-sysvar-value-list"
              );
              homematicSysvarDiv.append(sysvarButton);
            }
            addHmMonitoring(
              systemVariable.getAttribute("ise_id"),
              (valueStr) => {
                if (valueStr === oldValue) {
                  return;
                }
                oldValue = valueStr;
                let allButtons = homematicSysvarDiv.getElementsByClassName(
                  "hm-sysvar-value-list"
                );
                for (let index = 0; index < allButtons.length; index++) {
                  if (index.toString() === valueStr) {
                    allButtons[index].classList.add("hm-selected");
                  } else {
                    allButtons[index].classList.remove("hm-selected");
                  }
                }
              }
            );
          }
          break;
        default: {
          const errorDiv = document.createElement("div");
          errorDiv.innerHTML =
            'Systemvariable des Typs <span style="color:red;">' +
            systemVariable.getAttribute("type") +
            "</span> nicht bekannt.";
          homematicSysvarDiv.appendChild(errorDiv);
          break;
        }
      }
    }
  }
  outputFnc("");
}

/**
 * @typedef {object} DataPoint
 * @property {string} iseId
 * @property {string} type
 * @property {string} value
 * @property {string} valuetype
 * @property {string} valueunit
 * @property {string} operations operations is readwriteevent:7, readevent:5 for example
 */
/**
 * @typedef {object} Channel
 * @property {string} name
 * @property {string} iseId
 * @property {string} type
 * @property {string} index
 * @property {string} direction
 * @property {DataPoint[]} datapoints
 */

/**
 *
 * @param {string} hmAddress
 * @param {string} datapointType Find a specific datapoint of this device
 * @param {string|undefined} overrideIndex
 */
function getDeviceInfo(
  hmAddress,
  datapointType = undefined,
  overrideIndex = undefined
) {
  let deviceList_deviceNode = cachedDocuments
    .get("devicelist")
    ?.querySelector('device[address="' + hmAddress + '"]');
  let deviceIse = deviceList_deviceNode?.getAttribute("ise_id");
  let firstActorChannelNode = deviceList_deviceNode?.querySelector(
    'channel[direction="RECEIVER"][visible="true"]'
  );
  //  let firstActorChannelIndex =
  //    firstActorChannelNode?.getAttribute("index") ?? overrideIndex;

  let stateList_deviceNode = cachedDocuments
    .get("statelist")
    ?.querySelector('device[ise_id="' + deviceIse + '"]');

  const DLallReceiverChannelNode = deviceList_deviceNode?.querySelectorAll(
    'channel[direction="RECEIVER"][visible="true"]'
  );
  const DLallSenderChannelNode = deviceList_deviceNode?.querySelectorAll(
    'channel[direction="SENDER"][visible="true"]'
  );
  const DLallUnknownChannelNode = deviceList_deviceNode?.querySelectorAll(
    'channel[direction="UNKNOWN"][visible="true"]'
  );
  /** @type {{receivers: Channel[],sender: Channel[], unknown: Channel[]}} */
  const result = {
    receivers: [],
    sender: [],
    unknown: [],
  };
  for (const DLchannel of DLallReceiverChannelNode) {
    /** @type {Channel} */
    let channelConfig = {
      iseId: DLchannel.getAttribute("ise_id"),
      name: DLchannel.getAttribute("name"),
      type: DLchannel.getAttribute("type"),
      index: DLchannel.getAttribute("index"),
      direction: DLchannel.getAttribute("direction"),
      datapoints: [],
    };
    const SLchannel = stateList_deviceNode?.querySelector(
      'channel[ise_id="' + DLchannel.getAttribute("ise_id") + '"]'
    );
    for (const SLdatapoint of SLchannel.children) {
      channelConfig.datapoints.push({
        iseId: SLdatapoint.getAttribute("ise_id"),
        type: SLdatapoint.getAttribute("type"),
        value: SLdatapoint.getAttribute("value"),
        valuetype: SLdatapoint.getAttribute("valuetype"),
        valueunit: SLdatapoint.getAttribute("valueunit"),
        operations: SLdatapoint.getAttribute("operations"),
      });
    }
    result.receivers.push(channelConfig);
  }
  for (const DLchannel of DLallSenderChannelNode) {
    /** @type {Channel} */
    let channelConfig = {
      iseId: DLchannel.getAttribute("ise_id"),
      name: DLchannel.getAttribute("name"),
      type: DLchannel.getAttribute("type"),
      index: DLchannel.getAttribute("index"),
      direction: DLchannel.getAttribute("direction"),
      datapoints: [],
    };
    const SLchannel = stateList_deviceNode?.querySelector(
      'channel[ise_id="' + DLchannel.getAttribute("ise_id") + '"]'
    );
    for (const SLdatapoint of SLchannel.children) {
      channelConfig.datapoints.push({
        iseId: SLdatapoint.getAttribute("ise_id"),
        type: SLdatapoint.getAttribute("type"),
        value: SLdatapoint.getAttribute("value"),
        valuetype: SLdatapoint.getAttribute("valuetype"),
        valueunit: SLdatapoint.getAttribute("valueunit"),
        operations: SLdatapoint.getAttribute("operations"),
      });
    }
    result.sender.push(channelConfig);
  }
  for (const DLchannel of DLallUnknownChannelNode) {
    /** @type {Channel} */
    let channelConfig = {
      iseId: DLchannel.getAttribute("ise_id"),
      name: DLchannel.getAttribute("name"),
      type: DLchannel.getAttribute("type"),
      index: DLchannel.getAttribute("index"),
      direction: DLchannel.getAttribute("direction"),
      datapoints: [],
    };
    const SLchannel = stateList_deviceNode?.querySelector(
      'channel[ise_id="' + DLchannel.getAttribute("ise_id") + '"]'
    );
    for (const SLdatapoint of SLchannel.children) {
      channelConfig.datapoints.push({
        iseId: SLdatapoint.getAttribute("ise_id"),
        type: SLdatapoint.getAttribute("type"),
        value: SLdatapoint.getAttribute("value"),
        valuetype: SLdatapoint.getAttribute("valuetype"),
        valueunit: SLdatapoint.getAttribute("valueunit"),
        operations: SLdatapoint.getAttribute("operations"),
      });
    }
    result.unknown.push(channelConfig);
  }

  let selectedDatapointNodes;
  /**
   * operations is readwriteevent:7, readevent:5 for example
   * @type{{
        iseId: string;
        name: string;
        operations: string;
      }[]} */
  let selectedDatapointNodeArray = [];
  if (datapointType) {
    selectedDatapointNodes = stateList_deviceNode?.querySelectorAll(
      'datapoint[type="' + datapointType + '"]'
    );
    for (const node of selectedDatapointNodes) {
      selectedDatapointNodeArray.push({
        iseId: node?.getAttribute("ise_id"),
        name: node?.parentElement?.getAttribute("name"),
        operations: node?.getAttribute("operations"),
      });
    }
  }
  let powerDatapointNode = stateList_deviceNode?.querySelector(
    'datapoint[type="' + "POWER" + '"]'
  );
  let tempDatapointNode = stateList_deviceNode?.querySelector(
    'datapoint[type="' + "ACTUAL_TEMPERATURE" + '"]'
  );
  let lowBatDatapointNode = stateList_deviceNode?.querySelector(
    'datapoint[type="' + "LOW_BAT" + '"]'
  );
  let opVoltDatapointNode = stateList_deviceNode?.querySelector(
    'datapoint[type="' + "OPERATING_VOLTAGE" + '"]'
  );
  let weekProgramLockDatapointNode = stateList_deviceNode?.querySelector(
    'datapoint[type="' + "WEEK_PROGRAM_CHANNEL_LOCKS" + '"]'
  );
  return {
    device: {
      type: deviceList_deviceNode?.getAttribute("device_type"),
      deviceName: deviceList_deviceNode?.getAttribute("name"),
      unreachableIseId: stateList_deviceNode
        ?.querySelector('datapoint[type="UNREACH"]')
        ?.getAttribute("ise_id"),
      sabotageIseId: stateList_deviceNode
        ?.querySelector('datapoint[type="SABOTAGE"]')
        ?.getAttribute("ise_id"),
    },
    firstActorChannel: {
      iseId: firstActorChannelNode?.getAttribute("ise_id"),
      index: firstActorChannelNode?.getAttribute("index"),
    },
    selectedDatapoints: selectedDatapointNodeArray,
    tempDatapoint: {
      iseId: tempDatapointNode?.getAttribute("ise_id"),
      name: tempDatapointNode?.getAttribute("name"),
    },
    batteryDatapoint: {
      lowBatIseId: lowBatDatapointNode?.getAttribute("ise_id"),
      name: lowBatDatapointNode?.getAttribute("name"),
      opVoltIseId: opVoltDatapointNode?.getAttribute("ise_id"),
    },
    power: {
      iseId: powerDatapointNode?.getAttribute("ise_id"),
      name: powerDatapointNode?.getAttribute("name"),
      valueunit: powerDatapointNode?.getAttribute("valueunit"),
    },
    weekProgramm: {
      iseId:
        weekProgramLockDatapointNode?.parentElement.getAttribute("visible") ===
        "true"
          ? weekProgramLockDatapointNode?.getAttribute("ise_id")
          : undefined,
    },
    receiver: result.receivers,
    sender: result.sender,
    unknown: result.unknown,
  };
}

function getDeviceSysinfo(/** @type string */ name) {
  const systemVariables = cachedDocuments
    .get("sysvarlist")
    ?.querySelectorAll("systemVariable");
  for (const elem of systemVariables ?? []) {
    if (elem.getAttribute("name") === name) {
      return elem;
    }
  }
  return undefined;
}

/**
 * @param {MouseEvent} evt
 * @this {HTMLButtonElement}
 */
function clickHandler(evt) {
  const target = this;
  let message;
  /** @type {HTMLElement} */
  let labelDiv = target.parentElement.querySelector(".label");
  if (target.classList.contains("hm-safe")) {
    // Skip confirmation
  } else if (
    labelDiv.firstChild.nodeValue.includes("Vera") ||
    labelDiv.firstChild.nodeValue.includes("Laura")
  ) {
    message = "Wirklich einen Aktor bei den Kindern schalten?";
  } else if (
    target.parentElement.dataset.hmPotentiallyUnsafeStateConfirm !==
      undefined &&
    target.classList.contains("hm-unsafe")
  ) {
    message = "Den Aktor wirklich schalten?";
  }

  if (message && !confirm(message)) {
    return;
  }
  setHomematicValue(target.dataset.hmActorDatapointId, target.value).then(
    (doc) => {
      /*
      outputFnc(
        'Success in writing value: '
        + (doc ? doc.firstElementChild?.firstElementChild?.getAttribute('new_value'):'')
        + ', to ise id: '
        + (doc? doc.firstElementChild?.firstElementChild?.getAttribute('id') : ''),
        'color: green;');
    */
    }
  );
}

/**
 *
 * @param {string} title
 * @param {string} value
 * @param {string} datapointId
 */
function createButton(title, value, datapointId, classList = []) {
  const button = document.createElement("button");
  button.addEventListener("click", clickHandler);
  button.innerHTML = title;
  button.value = value;
  button.dataset.hmActorDatapointId = datapointId;
  if (classList.length) {
    button.classList.add(...classList);
  }
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
    host +
      baseXMLAPIpath +
      "statechange.cgi" +
      "?" +
      "ise_id=" +
      ise_id.join(",") +
      "&" +
      "new_value=" +
      value.join(",")
  );
}

/**
 *
 * @param {string[]} iseIds
 */
function getMultipleHomematicValue(iseIds) {
  return urlToDoc(
    host + baseXMLAPIpath + "state.cgi?datapoint_id=" + iseIds.join(",")
  )
    .then((doc) => {
      /**@type {Map<string, string>} */
      let valueMap = new Map();
      for (const datapoint of doc.querySelectorAll("datapoint[ise_id]")) {
        valueMap.set(
          datapoint.getAttribute("ise_id"),
          datapoint.getAttribute("value")
        );
      }
      return valueMap;
    })
    .catch((ex) => {
      // ignore errors
      // console.error(ex);
      return /** @type {Map<string, string>} */ (new Map());
      //throw ex; //new Error('Unexpected error');
    });
}

/**
 *
 * @param {string} ise_id
 */
function getHomematicValue(ise_id) {
  if (!ise_id) {
    return new Promise((data) => {});
  }
  return urlToDoc(
    host + baseXMLAPIpath + "state.cgi" + "?" + "datapoint_id=" + ise_id
  )
    .then((doc) => {
      return doc
        .querySelector('datapoint[ise_id="' + ise_id + '"]')
        ?.getAttribute("value");
    })
    .catch((ex) => {
      console.error(ex);
      return Promise.reject(new Error("Unexpected error"));
    });
}

/**
 *
 * @param {string|undefined} iseId
 * @param {(value: string)=>void} callback
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
    document.visibilityState === "visible"
  ) {
    getMultipleHomematicValue(Array.from(monitorList.keys())).then(
      (resultMap) => {
        for (const [iseId, hmValue] of resultMap) {
          const cbList = monitorList.get(iseId);
          for (const cb of cbList) {
            cb(hmValue);
          }
        }
      }
    );
  }
  setTimeout(hmMonitoring, 1000);
};
hmMonitoring();

let notificationContainer = document.getElementsByClassName("notifications")[0];
let hmFetchNotification = function () {
  if (
    notificationContainer &&
    navigator.onLine &&
    document.visibilityState === "visible"
  ) {
    urlToDoc(host + baseXMLAPIpath + "systemNotification.cgi").then((doc) => {
      notificationContainer.textContent = "";
      let systemNotifications = doc.querySelectorAll(
        "systemNotification > notification"
      );
      for (const elem of systemNotifications) {
        let notificationDiv = document.createElement("div");
        let iseId = elem.getAttribute("ise_id");
        let deviceName =
          cachedDocuments
            .get("statelist")
            ?.querySelector('[ise_id="' + iseId + '"]')
            ?.closest("device")
            ?.getAttribute("name") ?? "Unbekanntes Gerät";
        let localTimestampStr = new Date(
          parseInt(elem.getAttribute("timestamp"), 10) * 1000
        ).toLocaleString("de");
        switch (elem.getAttribute("type")) {
          case "SABOTAGE":
          case "ERROR_SABOTAGE":
            {
              notificationDiv.append(
                "Sabotage-Alarm für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-sabotage");
            }
            break;
          case "STICKY_SABOTAGE":
            {
              notificationDiv.append(
                "Hatte Sabotage-Alarm für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-sticky-sabotage");
            }
            break;
          case "CONFIG_PENDING":
            {
              notificationDiv.append(
                "Konfigurationsdaten stehen zur Übertragung an für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-config-pending");
            }
            break;
          case "LOW_BAT":
          case "LOWBAT":
            {
              notificationDiv.append(
                "Niedriger Batteriestand für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-low-bat");
            }
            break;
          case "U_SOURCE_FAIL":
            {
              notificationDiv.append(
                "Netzteil ausgefallen für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-source-fail");
            }
            break;
          case "USBH_POWERFAIL":
            {
              notificationDiv.append(
                "USB-Host deaktiviert für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-usbhost-powerfail");
            }
            break;
          case "STICKY_UNREACH":
            {
              notificationDiv.append(
                "Dauerhafte Kommunikationsstörung für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-sticky-unreach");
            }
            break;
          case "UNREACH":
            {
              notificationDiv.append(
                "Kommunikationsstörung für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-unreach");
            }
            break;
          case "ERROR_NON_FLAT_POSITIONING":
            {
              notificationDiv.append(
                "Fehler Lageerkennung für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-non-flat-positioning");
            }
            break;
          case "UPDATE_PENDING":
            {
              notificationDiv.append(
                "Neue Firmware verfügbar für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-update-pending");
            }
            break;
          case "DEVICE_IN_BOOTLOADER":
            {
              notificationDiv.append(
                "Device startet neu für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-device-in-bootloader");
            }
            break;
          case "ERROR_REDUCED":
            {
              notificationDiv.append(
                "Temperatur kritisch (Lastabsenkung) für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-error-reduced");
            }
            break;
          case "ERROR_POWER_FAILURE":
            {
              notificationDiv.append(
                "Spannungsversorgung fehlerhaft für " +
                  deviceName +
                  " (seit " +
                  localTimestampStr +
                  ")"
              );
              notificationDiv.classList.add("hm-power-failure");
            }
            break;
          default:
            notificationDiv.append(
              "Unsupported system notification for type " +
                elem.getAttribute("type") +
                " device: " +
                deviceName +
                " (seit " +
                localTimestampStr +
                ")"
            );
        }
        notificationContainer.appendChild(notificationDiv);
      }
      if (systemNotifications.length) {
        let confirmButton = document.createElement("button");
        confirmButton.innerHTML = "Bestätigen";
        confirmButton.addEventListener("click", (evt) => {
          return urlToDoc(
            host + baseXMLAPIpath + "systemNotificationClear.cgi"
          );
        });
        notificationContainer.append(confirmButton);
      }
    });
  }
  setTimeout(hmFetchNotification, 3000);
};
hmFetchNotification();

if ("wakeLock" in navigator) {
  /** @type {null | EventTarget & {release:()=>{}}} */
  let wakeLock = null;

  let wakeLockCheckbox = document.createElement("input");
  wakeLockCheckbox.type = "checkbox";

  let labelelem = document.createElement("label");
  labelelem.append(wakeLockCheckbox, "Bildschirm aktiv halten");
  document.body.appendChild(labelelem);

  wakeLockCheckbox.addEventListener("change", (evt) => {
    let checkbox = /** @type {HTMLInputElement} */ (event.target);
    if (checkbox.checked) {
      navigator["wakeLock"]
        .request("screen")
        .then((data) => {
          wakeLock = data;
          wakeLock.addEventListener("release", () => {
            console.log("Screen Wake Lock was released");
            checkbox.checked = false;
          });
          console.log("Screen Wake Lock is active");
        })
        .catch((err) => {
          console.error(`${err.name}, ${err.message}`);
        });
    } else {
      wakeLock?.release();
      wakeLock = null;
    }
  });
}

// if(window.location.protocol === "https:" && 'serviceWorker' in navigator) {
//     navigator.serviceWorker.register('serviceWorker.js').then((registration) => {
//         let serviceWorker;
//         if (registration.installing) {
//             serviceWorker = registration.installing;
//             console.info('main.ts: installing service worker');
//         } else if (registration.waiting) {
//             serviceWorker = registration.waiting;
//             console.info('main.ts: waiting service worker');
//         } else if (registration.active) {
//             serviceWorker = registration.active;
//             console.info('main.ts: active service worker');
//         }
//         if (serviceWorker) {
//             // logState(serviceWorker.state);
//             serviceWorker.addEventListener('statechange', (evt) => {
//                 console.info(evt.type, 'for ServiceWorker to new state:',  /** @type {ServiceWorker} */ (evt.target).state);
//             });
//         }
//     }).catch((error) => {
//         console.error('main.ts: registering service worker failed', error);
//     });
// }
