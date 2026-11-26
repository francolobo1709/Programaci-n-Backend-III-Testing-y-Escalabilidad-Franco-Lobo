import { UserModel } from '../models/user.model.js';

const SAFE_USER_PROJECTION = '-__v -isActive';

export class UsersRepository {
  async findAll(filter = {}) {
    return UserModel.find({ isActive: true, ...filter }, SAFE_USER_PROJECTION)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id) {
    return UserModel.findOne({ _id: id, isActive: true }, SAFE_USER_PROJECTION).lean();
  }

  async findByEmail(email) {
    return UserModel.findOne({ email: email.toLowerCase().trim() }, SAFE_USER_PROJECTION).lean();
  }

  async create(userData) {
    const created = await UserModel.create(userData);
    const plain = created.toObject();
    delete plain.__v;
    delete plain.isActive;
    return plain;
  }

  async updateById(id, updateFields) {
    return UserModel.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updateFields },
      { new: true, runValidators: true, projection: SAFE_USER_PROJECTION }
    ).lean();
  }

  async updateRole(id, role) {
    return this.updateById(id, { role });
  }

  async softDeleteById(id) {
    return UserModel.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true, projection: SAFE_USER_PROJECTION }
    ).lean();
  }
}
