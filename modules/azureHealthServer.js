/**
 * @fileoverview FlynCodes Universal Design - Azure Health Status Webserver
 * @version 2
 * @date 2025-03-18
 * @author FlynCodes {@link https://flyn.codes|FlynCodes website}
 * @license Proprietary. All Rights Reserved © 2025 Flyn.
 * @description This file is for organisations, companies, non-profits, and projects FlynCodes is involved in, ensuring a universal and consistent approach with best practices across all projects.
 */

import http from 'node:http'
const ipAddr = process.env.IP_ADDR || '0.0.0.0'
const port = process.env.PORT || 8080

export default {
  startHTTPServer: () => {
    http.createServer((req, res) => {
      res.writeHead(200)
      res.write('OK')
      res.end()
    }).listen(port, ipAddr, () => {
      console.log('Running webserver on ' + ipAddr + ':' + port)
    })
  }
}
