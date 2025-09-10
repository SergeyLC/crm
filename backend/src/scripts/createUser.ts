import bcrypt from "bcrypt";
import dotenv from "dotenv";
import prisma from "../prisma/client";
import { UserRole } from "generated/prisma-client";

dotenv.config();

export async function createUser(name = "User", email = "user@example.com", password = "user", role: UserRole = "ADMIN") {
  console.log(`Creating user: ${name}, email: ${email}, role: ${role}`);
  try {
    // Check if database connection is successful
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma");

    // Check if employee already exists
    const employeeExists = await prisma.user.findUnique({
      where: { email }
    });
    
    if (employeeExists) {
      console.log(`User with email ${email} already exists`);
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      }
    });

    console.log("User created successfully:", user.id);
  } catch (error) {
    console.error("Error creating user:", error);
  } finally {
    await prisma.$disconnect();
    console.log("Disconnected from database");
  }
}

if (require.main === module) {
  // console.log(`Command line arguments: ${process.argv.join(", ")}`);
  const args = process.argv.slice(2);
  const name = args[0] || "User";
  const email = args[1] || "user@example.com";
  const password = args[2] || "user";
  const role = (args[3] || "EMPLOYEE").toUpperCase() as UserRole;

  createUser(name, email, password, role);
}