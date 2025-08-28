import { UpdateUserDTO } from "../model/types";

/**
 * Подготовка данных пользователя перед отправкой на сервер
 * Удаляет вложенные объекты и другие поля, которые не должны быть отправлены
 */
export function sanitizeUserData(userData: Partial<UpdateUserDTO>): UpdateUserDTO {
  const {
    name,
    email,
    password,
    role,
    status,
  } = userData;

  // Формируем объект только с нужными полями
  const sanitizedData: UpdateUserDTO = {};

  if (name !== undefined) sanitizedData.name = name;
  if (email !== undefined) sanitizedData.email = email;
  if (password !== undefined) sanitizedData.password = password;
  if (role !== undefined) sanitizedData.role = role;
  if (status !== undefined) sanitizedData.status = status;

  return sanitizedData;
}