/* setup */
const redis_mq = require("rsmq");
const rsmq = new redis_mq({ host: 'auth_queue', port: 6379, ns: 'rsmq' });
const transporter = require("nodemailer").createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "bt.auth.service@gmail.com",
        pass: "BTAuthService!"
    },
});



/* @TODO: why does ```while (true)``` breaks this? */
setInterval(() => {
    if (rsmq.connected) {
        rsmq.popMessage({ qname: "register_message_queue" }, async(error, data) => {
            if (error) {
                return
            }

            if (data.id) {
                const message = JSON.parse(data.message);
                console.log("Message received and deleted from queue", data);
                try {
                    await transporter.sendMail({
                        from: 'BT Auth Service',
                        to: message.email,
                        subject: "Welcome to the BT Auth Service",
                        text: `Welcome to my Authentication Microservice, ${message.name}!`,
                        html: `<h3>Welcome to my Authentication Microservice, ${message.name}!</h3>`,
                    });
                } catch (e) {
                    console.log('error sending message, it was re-added to the queue')
                    await rsmq.sendMessageAsync({ qname: 'register_message_queue', message: JSON.stringify({ email: message.email, name: message.name }) });
                }
            }
        });
    } else {
        console.log('could not scan queue! not connected to redis!');
    }
}, 1000);