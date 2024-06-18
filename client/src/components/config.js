
const { REACT_APP_USERNAME, REACT_APP_PASSWORD, REACT_APP_MSISDN } = process.env

export const config = {
    voip: {
        SERVER_PORT: 5063,
        HTTP: 'https://',
        WS: 'wss://',
        SIP: 'sip:',
        HOST: 'voipfront-1.ea-1.eu-west-1.agnet.com',
        SIP_HOST: 'server-1.ea-1.eu-west-1.agnet.com',
        VOIP_TOKEN_ENDPOINT: 'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/self/voip?filter=getVoipToken',
        VOIP_REFUSE_ENDPOINT: 'https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/self/voip?filter=refuseCall',
        VOIP_WEBHOOK_ENDPOINT: 'https://api.ea-1.eu-west-1.agnet.com/api/v2/hooks/subscriber/self/voip?Type=call.start',
    },
    auth: {
        ACCESS_TOKEN_ENDPOINT: 'https://openid-keycloak-test.tactilon-smartwisp.com/auth/realms/master/protocol/openid-connect/token',
        USERNAME: "yahya.khafif@airbus.com",
        PASSWORD: "JamilaOuahidy1234",
        GRANT_TYPE: 'password',
        CLIENT_ID: 'kong',
        CLIENT_SECRET: 'cb59044f-f674-455c-8798-ee11c169c861',
        MSISDN: REACT_APP_MSISDN,
    },
    receiver: {
        WS_ENDPOINT_URL: "http://127.0.0.1/web-socket",
        WS_NOTIFICATION_ENDPOINT: "http://CALL_RECEIVER_HOST/api/v1/hook/call/events/",
        WS_SUBSCRIPTION_PATH: '/call/events/'
    }
}
