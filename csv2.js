const Transform = require('readable-stream/transform')
    , inherits  = require('util').inherits

function CSV2 (options) {
  if (!(this instanceof CSV2))
    return new CSV2(options)
  if (!options)
    options = {}
  options.objectMode = true
  Transform.call(this, options)
  this._rawbuf = ''
}

inherits(CSV2, Transform)

CSV2.prototype._processCSV = function (last) {
  var lines = this._rawbuf.split(/\r?\n/)
    , i

  if (lines.length && !lines[lines.length - 1].length)
    lines.pop()

  for (i = 0; i < lines.length - 2; i++)
    this._processLine(lines[i])

  if (!last)
    this._rawbuf = lines[lines.length - 1] || ''
  else if (lines.length && lines[lines.length - 1].length)
    this._processLine(lines[lines.length - 1])
}

CSV2.prototype._processLine = function (line) {
  var inQuote   = false
    , prevQuote = false
    , startStr  = true
    , tokens    = []
    , quote     = '"'
    , i, c
    , b = ''

  for (i = 0; i < line.length; i++) {
    c = line[i]
    if (c == quote) {
      if (prevQuote) {
        b += c
        prevQuote = false
      } else if (!startStr) {
        prevQuote = true
      } else {
        startStr = false
        inQuote = true
      }
    } else {
      if (startStr)
        startStr = false
      if (prevQuote)
        inQuote = !inQuote
      prevQuote = false
      if (c == ',' && !inQuote) {
        inQuote = false
        tokens.push(b)
        b = ''
        inQuote   = false
        prevQuote = false
        startStr  = true
      } else
        b += c
    }
  }
  if (startStr || b.length > 0)
    tokens.push(b)

  this.push(tokens)
}

CSV2.prototype._transform = function (chunk, enc, callback) {
  this._rawbuf += chunk.toString('utf8')
  this._processCSV()
  callback()
}

CSV2.prototype._flush = function (callback) {
  this._processCSV(true)
  callback()
}

module.exports = CSV2