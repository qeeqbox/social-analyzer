function classify_site_response (status, body = '') {
  const source = String(body || '').toLowerCase()
  if (body === 'error-get-url' || status >= 500) {
    return {
      status: 'timeout',
      reason: 'request failed or timed out'
    }
  }

  if (source.includes('captcha') || source.includes('cloudflare') || source.includes('attention required') || source.includes('verify you are human') || source.includes('cf-chl')) {
    return {
      status: 'captcha',
      reason: 'challenge page detected'
    }
  }

  if (source.includes('safeline') || source.includes('waf') || source.includes('access denied') || status === 403) {
    return {
      status: 'blocked',
      reason: 'waf or access denied page detected'
    }
  }

  if (status === 404 || source.includes('not found') || source.includes('页面不存在') || source.includes('用户不存在')) {
    return {
      status: 'not_found',
      reason: 'site returned a missing-user pattern'
    }
  }

  return {
    status: 'ok',
    reason: 'response looks reachable'
  }
}

export {
  classify_site_response
}
