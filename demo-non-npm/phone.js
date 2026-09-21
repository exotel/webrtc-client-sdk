// Placeholder SIP account config. Do NOT put real credentials here -- this file is
// committed to a public repository.
//
// For local use, copy this file to phone.local.js and fill in your values there.
// phone.local.js is gitignored, and index.html loads it after this file, so it wins.
phone = '[\
    {\
        "Username":"<VOIP Username>",\
        "DisplayName":"<Display Name>",\
        "HostServer":"<VOIP Proxy Address>",\
        "Domain":"<VOIP Domain Address>",\
        "Port":443,\
        "Password":"<VOIP Password>",\
        "CallTimeout":1000,\
        "Security": "wss",\
        "EndPoint": "wss",\
        "AccountSID":"<Your Account SID>",\
        "AccountNo":"<VOIP Username>",\
        "AutoRegistration": true\
    }\
]';
