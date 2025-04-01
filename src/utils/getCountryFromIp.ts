import axios from "axios";

export async function getCountryFromIP(ipAddress: any) {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
        if (response.data.status === 'success') {
            return response.data.countryCode; // or response.data.country for the full name
            console.log(response)
        } else {
            console.error('IP geolocation failed:', response.data.message);
            return null;
        }
    } catch (error) {
        console.error('Error fetching IP geolocation:', error);
        return null;
    }
}