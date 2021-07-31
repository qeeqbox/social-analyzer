const helper = require('./helper.js')
const {
  createWorker
} = require('tesseract.js')

function merge_dicts (temp_dict) {
  const result = {}
  temp_dict.forEach(item => {
    for (const [key, value] of Object.entries(item)) {
      if (result[key]) {
        result[key] += value
      } else {
        result[key] = value
      }
    }
  })
  return result
}

async function detect (type, uuid, username, options, site, source = '', text_only = '', screen_shot = '') {
  const temp_profile = []
  const temp_detected = []
  let detections_count = 0
  await Promise.all(site.detections.map(async detection => {
    if (detection.type === 'shared') {
      const shared_detection = await helper.shared_detections.find(o => o.name === detection.name)
      const [val1, val2, val3] = await detect_logic(type, uuid, username, options, shared_detection, source, text_only, screen_shot)
      temp_profile.push(val1)
      temp_detected.push(val2)
      detections_count += val3
    } else if (detection.type === 'generic') {
      helper.verbose && console.log('None')
    } else if (detection.type === 'special') {
      helper.verbose && console.log('None')
    }
  }))

  const [val1, val2, val3] = await detect_logic(type, uuid, username, options, site, source, text_only, screen_shot)
  temp_profile.push(val1)
  temp_detected.push(val2)
  detections_count += val3
  // console.log(temp_profile,merge_dicts(temp_detected),detections_count)
  return [merge_dicts(temp_profile), merge_dicts(temp_detected), detections_count]
}

async function detect_logic (type, uuid, username, options, site, source = '', text_only = '', screen_shot = '') {
  const temp_profile = Object.assign({}, helper.profile_template)
  const temp_detected = Object.assign({}, helper.detected_websites)
  let detections_count = 0
  await Promise.all(site.detections.map(async detection => {
    if (source !== '' && helper.detection_level[helper.detection_level.current][type].includes(detection.type) && detection.type !== 'shared' && detection.type !== 'generic' && detection.type !== 'special') {
      try {
        detections_count += 1
        temp_detected.count += 1
        let temp_found = 'false'
        if (detection.type === 'ocr' && screen_shot !== '' && options.includes('FindUserProfilesSlow')) {
          const temp_buffer_image = Buffer.from(screen_shot, 'base64')
          const ocr_worker = createWorker()
          try {
            await ocr_worker.load()
            await ocr_worker.loadLanguage('eng')
            await ocr_worker.initialize('eng')
            const {
              data: {
                text
              }
            } = await ocr_worker.recognize(temp_buffer_image)
            await ocr_worker.terminate()
            if (text !== '') {
              if (text.toLowerCase().includes(detection.string.toLowerCase())) {
                temp_found = 'true'
              }
              if (detection.return === temp_found) {
                temp_profile.found += 1
                temp_detected.ocr += 1
                if (detection.return === 'true') {
                  temp_detected.true += 1
                } else {
                  temp_detected.false += 1
                }
              }
            } else {
              detections_count -= 1
              temp_detected.count -= 1
            }
          } catch (err) {
            detections_count -= 1
            temp_detected.count -= 1
          }
        } else if (detection.type === 'normal' && source !== '') {
          if (source.toLowerCase().includes(detection.string.replace('{username}', username).toLowerCase())) {
            temp_found = 'true'
          }

          if (detection.return === temp_found) {
            temp_profile.found += 1
            temp_detected.normal += 1
            if (detection.return === 'true') {
              temp_detected.true += 1
            } else {
              temp_detected.false += 1
            }
          }
        } else if (detection.type === 'advanced' && text_only !== '' && text_only !== 'unavailable') {
          if (text_only.toLowerCase().includes(detection.string.replace('{username}', username).toLowerCase())) {
            temp_found = 'true'
          }

          if (detection.return === temp_found) {
            temp_profile.found += 1
            temp_detected.advanced += 1
            if (detection.return === 'true') {
              temp_detected.true += 1
            } else {
              temp_detected.false += 1
            }
          }
        }
      } catch (err) {
        helper.verbose && console.log(err)
      }
    }
  }))

  helper.verbose && console.log({
    'Temp Profile': temp_profile,
    Detected: temp_detected
  })

  return [temp_profile, temp_detected, detections_count]
}

module.exports = {
  detect
}
