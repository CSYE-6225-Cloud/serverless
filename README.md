# Assignment 7 CSYE6225

# Steps Taken:
1. Connected the cloud function to the database on GCP's VPC using VPC connector in terraform.
2. Used Sequelize to connect to the Postgres database
3. functions.cloudevent is used when event trigger is used. But since we are using pubsub subscriber generated in terraform, it's default trigger is in http. Hence we use functions.http
4. Email is triggered using mailgun 
5. Generated token using UUID and stored it as ID in userVerifications table along with email and timestamp of when the email is sent to track the email verification link 


# Reference links:
1. https://reflectoring.io/google-pub-sub-in-node-js/