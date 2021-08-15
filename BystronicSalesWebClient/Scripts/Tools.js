// vesrion info
var VersionInfo = { MajorVersion: 1, MinorVesion: 0, BuildNumber: '1', Country: 'US' }; // US/CA
setVersionInfo = (versionInfo) => VersionInfo = versionInfo;
getVersionInfo = () => VersionInfo;
getVersion = () => 'v.' + VersionInfo.MajorVersion + '.' + VersionInfo.MinorVesion + '.' + VersionInfo.BuildNumber;
isDemoVersion = () => VersionInfo.BuildNumber === 'Demo';

parseJsonDate = function parseJsonDate(jsonDateString) {
    if (!jsonDateString) return null;
    return new Date(parseInt(jsonDateString.replace('/Date(', '').replace(')', '')));
};

saveCookie = function (cookies, cookie, value) {
    if (cookie && value != null) {
        var cookieExpirationDate = new Date();
        cookieExpirationDate.setDate(cookieExpirationDate.getYear() + 1);
        cookies.put(cookie, value, { expires: cookieExpirationDate });
    }
};

unzipData = function (zippedData) {
    var strData = atob(zippedData);

    // Convert binary string to character-number array
    var charData = strData.split('').map(function (x) { return x.charCodeAt(0); });

    // Turn number array into byte-array
    var binData = new Uint8Array(charData);

    // Pako magic
    var data = pako.inflate(binData);

    // Convert gunzipped byteArray back to ascii string
    var str = handleCodePoints(data);

    return $.parseJSON(str);
};

// Convert gunzipped byteArray back to ascii string
handleCodePoints = function (array) {
    var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
    var index = 0;
    var result = '';
    var slice;
    while (index < array.length) {
        slice = array.subarray(index, Math.min(index + CHUNK_SIZE, array.length));
        result += String.fromCharCode.apply(null, slice);
        index += CHUNK_SIZE;
    }
    return result;
};



