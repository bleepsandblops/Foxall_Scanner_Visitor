Foxall Publishing Rooms
=======================

Install
-----------------

### Install node 
https://nodejs.org/dist/v4.4.2/node-v4.4.2.pkg

### Install git
https://git-scm.com/download/mac

### Install Sublime Text
https://www.sublimetext.com/

### Open up Terminal
Applications / Utilities / Terminal

### Download the repo
```
git clone https://github.com/bleepsandblops/Foxall_Scanner_Visitor.git
```

### Install the dependencies
```
cd Foxall_Scanner_Visitor
npm install
```

### Create an empty images directory
```
mkdir images
```

### Rename the env file and the credentials file
```
mv example.env .env
mv example.credentials credentials
```

### Create a hidden .aws directory in your home folder
```
mkdir ~/.aws
```

### Open up Sublime and open .env and credentials file
Ask Seb to tell you what to change in those

### Move the credentials file to the .aws folder
```
mv credentials ~/.aws/
```

### Start the app
```
node app.js
```