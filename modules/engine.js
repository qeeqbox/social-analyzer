var helper = require('./helper.js')
var tesseract = require("tesseract.js")

async function detect(type, uuid, username, options, site, source="", screen_shot="") {
  var temp_profile = Object.assign({}, helper.profile_template);
  var temp_detected = Object.assign({}, helper.detected_websites);
  var detections_count = 0;
  await Promise.all(site.detections.map(async detection => {
    if (source != "" && helper.detection_level[helper.detection_level.current][type].includes(detection.type)) {
      try {
        detections_count += 1
        temp_detected.count += 1
        var temp_found = "false"
        if (detection.type == "ocr" && screen_shot != "" && options.includes("FindUserProfilesSlow")) {
          const temp_buffer_image = Buffer.from(screen_shot, "base64")
          await tesseract.recognize(temp_buffer_image, "eng").then(result => {
              text = result.data.text.replace(/[^A-Za-z0-9]/gi, "");
              detection.string = detection.string.replace(/[^A-Za-z0-9]/gi, "");
              if (text != "") {
                if (text.toLowerCase().includes(detection.string.toLowerCase())) {
                  temp_found = "true";
                }
                if (detection.return == temp_found) {
                  temp_profile.found += 1
                  temp_detected.ocr += 1
                  if (detection.return == 'true'){
                    temp_detected.true += 1
                  }else{
                    temp_detected.false += 1
                  }
                }
              }
            })
            .catch(err => {
              helper.verbose && console.log(err);
            })
        } else if (detection.type == "normal" && source != "") {
          if (source.toLowerCase().includes(detection.string.replace("{username}", username).toLowerCase())) {
            temp_found = "true";
          }

          if (detection.return == temp_found) {
            temp_profile.found += 1
            temp_detected.normal += 1
            if (detection.return == 'true'){
              temp_detected.true += 1
            }else{
              temp_detected.false += 1
            }
          }
        } else if (detection.type == "advanced" && text_only != "") {
          if (text_only.toLowerCase().includes(detection.string.replace("{username}", username).toLowerCase())) {
            temp_found = "true";
          }

          if (detection.return == temp_found) {
            temp_profile.found += 1
            temp_detected.advanced += 1
            if (detection.return == 'true'){
              temp_detected.true += 1
            }else{
              temp_detected.false += 1
            }
          }
        }
      } catch (err) {
        helper.verbose && console.log(err);
      }
    }
  }));

  helper.verbose && console.log({"Temp Profile":temp_profile,"Detected":temp_detected})

  return {temp_profile, temp_detected, detections_count}
}

module.exports = {
  detect
}
