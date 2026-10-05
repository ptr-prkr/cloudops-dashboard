variable "project_name" {
  description = "Name used for CloudOps AWS resources"
  type        = string
  default     = "cloudops-dashboard"
}

variable "aws_region" {
  description = "AWS region used for the deployment"
  type        = string
  default     = "eu-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for the CloudOps VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.20.1.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key imported into AWS"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_allowed_cidr" {
  description = "CIDR permitted to access EC2 over SSH"
  type        = string
  sensitive   = true
}