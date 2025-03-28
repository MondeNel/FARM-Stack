# Use the official Python 3 base image from Docker Hub
FROM python:3

# Set the working directory inside the container
# All subsequent commands will be run from this directory
WORKDIR /usr/src/app

# Copy the requirements.txt file from the local machine to the container
# This file contains all the Python dependencies required for the project
COPY requirements.txt ./

# Install the Python dependencies from requirements.txt
# The '--no-cache-dir' flag ensures that pip doesn't cache any installation files, reducing the image size
# '--upgrade' ensures that the latest versions of the packages are installed, even if they are already installed
RUN pip install --no-cache-dir --upgrade -r ./requirements.txt

# Expose port 3001 so that the application can communicate with the outside world
# This is the port where FastAPI will be running inside the container
EXPOSE 3001

# Set the default command to run when the container starts
# In this case, we run the FastAPI backend using the Python script 'server.py' located in the 'src' directory
CMD [ "python", "./src/server.py" ]
