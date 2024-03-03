terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.1"
    }
  }
}

provider "docker" {}

resource "docker_image" "mongo" {
  name         = "mongo"
  keep_locally = false
}

resource "docker_container" "mongo" {
  name  = "mongo"
  image = docker_image.mongo
  ports {
    internal = 27017
    external = 27017
  }
}