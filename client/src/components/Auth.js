import { config } from "./config";

export const getAccessToken = () => {
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("username", config.auth.USERNAME);
    urlencoded.append("password", config.auth.PASSWORD);
    urlencoded.append("grant_type", 'password');
    urlencoded.append("client_id", 'kong');
    urlencoded.append("client_secret", config.auth.CLIENT_SECRET);

    const requestOptions = {
        method: 'POST',
        headers: requestHeaders,
        body: urlencoded,
        redirect: 'follow'
    };

    return new Promise((resolve, reject) => {
        fetch('https://openid-keycloak-test.tactilon-smartwisp.com/auth/realms/master/protocol/openid-connect/token', requestOptions)
            .then(response => response.json())
            .then(result => {
                resolve(result.access_token);
                console.log(result);
            })
            .catch(error => reject(error));
    });
};
export const getVoipToken = (accessToken) => {
    return new Promise((resolve, reject) => {
        const requestHeaders = new Headers();
        requestHeaders.append("Authorization", `Bearer ${accessToken}`);

        const requestOptions = {
            method: 'GET',
            headers: requestHeaders,
            redirect: 'follow'
        };

        fetch('https://api.ea-1.eu-west-1.agnet.com/api/v2/subscriber/self/voip?filter=getVoipToken', requestOptions)
            .then(response => response.json())
            .then(result => {
                const VoipToken = result.results.VoipToken;
                resolve(VoipToken);
            })
            .catch(error => reject(error));
    });
};
