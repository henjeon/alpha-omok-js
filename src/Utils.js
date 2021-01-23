import { isMobileOnly as isMobileOnlyImported } from 'react-device-detect'

const isDevelopment = process.env.NODE_ENV && process.env.NODE_ENV === 'development'
const isMobileOnly = isMobileOnlyImported === true

async function sleep(seconds) {
    return new Promise((resolve) => (setTimeout(resolve, seconds * 1000)))
}

export { isDevelopment, isMobileOnly, sleep }