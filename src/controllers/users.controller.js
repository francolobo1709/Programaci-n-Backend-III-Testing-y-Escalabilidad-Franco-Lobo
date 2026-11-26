import { HTTP_STATUS } from '../constants/index.js';
import { UsersService } from '../services/users.service.js';

export class UsersController {
  constructor(usersService = new UsersService()) {
    this.usersService = usersService;
  }

  getAll = async (req, res) => {
    try {
      const users = await this.usersService.getAllUsers({ role: req.query.role });
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: users });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  getById = async (req, res) => {
    try {
      const user = await this.usersService.getUserById(req.params.id);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: user });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  create = async (req, res) => {
    try {
      const created = await this.usersService.createUser(req.body);
      return res.status(HTTP_STATUS.CREATED).json({ ok: true, data: created });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const updated = await this.usersService.updateUser(req.params.id, req.body);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: updated });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  updateRole = async (req, res) => {
    try {
      const updated = await this.usersService.changeUserRole(req.params.id, req.body.role);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: updated });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.usersService.deleteUser(req.params.id);
      return res.status(HTTP_STATUS.OK).json({ ok: true, data: deleted });
    } catch (error) {
      const status = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return res.status(status).json({ ok: false, message: error.message });
    }
  };
}
