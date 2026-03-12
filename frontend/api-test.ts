import axios from 'axios';

async function run() {
    try {
        console.log("Logging in as admin...");
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            username: 'admin',
            password: 'root@123456'
        });
        const token = loginRes.data.result.token;
        console.log("Got token successfully.");

        console.log("Attempting to create a BusType...");
        const createRes = await axios.post('http://localhost:8080/api/fleet/bus-types', {
            name: "Test Bus " + Date.now(),
            totalSeats: 30,
            seatMap: [
                { row: 1, col: "A", type: "NORMAL" }
            ]
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Success:", createRes.data);
    } catch (err: any) {
        console.error("Error occurred!");
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

run();
