const functions = require("@google-cloud/functions-framework");
const mailgun = require("mailgun-js");
const mg = mailgun({
  apiKey: process.env.MAILGUN_APIKEY,
  domain: process.env.MAILGUN_DOMAIN,
});
const Sequelize = require("sequelize").Sequelize;
const QueryTypes = require("sequelize").Sequelize;
const uuid = require("uuid");

const databaseConnection = async () => {
  try {
    const sequelizeInstance = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.HOST,
        dialect: process.env.DIALECT,
        logging: false,
      }
    );
    await sequelizeInstance.authenticate();
    console.log("Database connection established");
    return sequelizeInstance; // Return the Sequelize instance if authentication is successful
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return null; // Return null if authentication fails
  }
};

functions.http("userCreated", async (req, res) => {
  try {
    console.log("Inside the cloud function");
    // Establish database connection
    const sequelizeInstance = await databaseConnection();
    if (!sequelizeInstance) {
      console.error("Database connection failed. Exiting function.");
      res.status(400).send();
      return;
    }

    const dataBuffer = req.body.message.data;
    console.log("dataBuffer:", dataBuffer);

    const base64 = Buffer.from(dataBuffer, "base64").toString();
    console.log("base64:", base64);
    const payload = JSON.parse(base64);
    const userEmail = payload.username;

    // Generate a unique verification token
    const token = uuid.v4();

    const verificationLink = `https://payalkhatri.me/v1/user/verifyUser?token=${token}`;

    const data = {
      from: "Mailgun Sandbox <postmaster@webapp.payalkhatri.me>",
      to: userEmail,
      subject: "Verify this link to create user",
      template: "user verification",
      "h:X-Mailgun-Variables": JSON.stringify({ link: verificationLink }),
    };
    const currentDate = new Date(Date.now());
    // Send email using Mailgun
    mg.messages().send(data, async (error, body) => {
      if (error) {
        console.error("Error sending verification email:", error);
        res.status(400).send();
        return;
      } else {
        console.log("Verification link emailed:", body);
        try {
          await sequelizeInstance
            .query(
              'INSERT INTO "userVerifications" (id,username, "verifyLinkTimestamp") VALUES (:id, :username, :verifyLinkTimestamp)',
              {
                replacements: {
                  id: token,
                  username: userEmail,
                  verifyLinkTimestamp: currentDate,
                },
                type: QueryTypes.INSERT,
              }
            )
            .then((result) => {
              console.log(
                "Insertion into the userVerifications table successful:",
                result
              );
              res.status(200).send();
              return;
            });
        } catch (error) {
          console.error(
            "Error inserting data into the userVerifications table:",
            error
          );
          res.status(400).send();
          return;
        }
      }
    });
  } catch (error) {
    console.error("Error processing CloudEvent:", error);
    res.status(400).send();
  }
});


