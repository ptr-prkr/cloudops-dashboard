output "instance_id" {
  description = "CloudOps EC2 instance ID"
  value       = aws_instance.cloudops.id
}

output "public_ip" {
  description = "Public IPv4 address of the CloudOps instance"
  value       = aws_instance.cloudops.public_ip
}

output "public_dns" {
  description = "Public AWS DNS hostname"
  value       = aws_instance.cloudops.public_dns
}

output "ssh_command" {
  description = "SSH command for the CloudOps EC2 instance"
  value       = "ssh ubuntu@${aws_instance.cloudops.public_ip}"
}

output "application_url" {
  description = "Public CloudOps Dashboard URL"
  value       = "http://${aws_instance.cloudops.public_ip}"
}

output "vpc_id" {
  value = aws_vpc.cloudops.id
}

output "subnet_id" {
  value = aws_subnet.public.id
}

output "security_group_id" {
  value = aws_security_group.cloudops.id
}

output "ubuntu_ami_id" {
  value = data.aws_ami.ubuntu.id
}