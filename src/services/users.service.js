import { HTTP_STATUS, ROLES } from '../constants/index.js';
import { UsersRepository } from '../repositories/users.repository.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export class UsersService {
  constructor(usersRepository = new UsersRepository()) {
    this.usersRepository = usersRepository;
  }

  validateId(id) {
    if (!id || !OBJECT_ID_REGEX.test(String(id))) {
      const error = new Error(`El identificador de usuario "${id}" no tiene un formato válido`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
  }

  normalizeAndValidateRole(role) {
    const normalizedRole = String(role).trim().toUpperCase();
    if (!Object.values(ROLES).includes(normalizedRole)) {
      const error = new Error(`Rol inválido. Valores permitidos: ${Object.values(ROLES).join(', ')}`);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }
    return normalizedRole;
  }

  async getAllUsers({ role } = {}) {
    const filter = {};
    if (role) {
      filter.role = this.normalizeAndValidateRole(role);
    }
    return this.usersRepository.findAll(filter);
  }

  async getUserById(id) {
    this.validateId(id);
    const user = await this.usersRepository.findById(id);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return user;
  }

  async createUser({ name, email, role = ROLES.USER }) {
    if (!name || String(name).trim() === '' || !email || String(email).trim() === '') {
      const error = new Error('Los campos name y email son obligatorios');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const normalizedRole = this.normalizeAndValidateRole(role);
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      const error = new Error('Ya existe un usuario registrado con ese email');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    return this.usersRepository.create({
      name: String(name).trim(),
      email: normalizedEmail,
      role: normalizedRole,
    });
  }

  async updateUser(id, { name, email, role }) {
    const currentUser = await this.getUserById(id);
    const updateFields = {};

    if (name !== undefined) {
      if (String(name).trim() === '') {
        const error = new Error('El nombre del usuario no puede estar vacío');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      updateFields.name = String(name).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail) {
        const error = new Error('El email del usuario no puede estar vacío');
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }
      if (normalizedEmail !== currentUser.email) {
        const existing = await this.usersRepository.findByEmail(normalizedEmail);
        if (existing) {
          const error = new Error('Ya existe un usuario registrado con ese email');
          error.statusCode = HTTP_STATUS.CONFLICT;
          throw error;
        }
      }
      updateFields.email = normalizedEmail;
    }

    if (role !== undefined) {
      updateFields.role = this.normalizeAndValidateRole(role);
    }

    if (Object.keys(updateFields).length === 0) {
      return currentUser;
    }

    return this.usersRepository.updateById(id, updateFields);
  }

  async changeUserRole(id, newRole) {
    this.validateId(id);
    if (!newRole) {
      const error = new Error('El campo role es obligatorio');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const normalizedRole = this.normalizeAndValidateRole(newRole);
    const updated = await this.usersRepository.updateRole(id, normalizedRole);

    if (!updated) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return updated;
  }

  async deleteUser(id) {
    await this.getUserById(id);
    return this.usersRepository.softDeleteById(id);
  }
}
