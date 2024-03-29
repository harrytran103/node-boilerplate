import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import Boom from '@hapi/boom';
import { prisma } from '@/generated/prisma-client';
import config from '@/config';

async function register(data) {
  const { password } = data;
  const hashPassword = await bcrypt.hash(password, 10);
  const newData = {
    ...data,
    password: hashPassword,
  };
  return prisma.createAccount(newData);
}

async function login(data) {
  const { username, password } = data;
  const account = await prisma.account({ username });
  if (!account) {
    throw Boom.notFound('username does not exist');
  }
  const match = await bcrypt.compare(password, account.password);
  if (!match) {
    throw new Error('password is incorrect');
  }
  const { id, role } = account;
  const { secretKey, expiresIn, algorithm } = config.jwt;
  const payload = {
    id,
    role,
  };
  const token = jwt.sign(payload, secretKey, { algorithm, expiresIn });
  return {
    token,
    account: _.omit(account, ['password']),
  };
}

export default {
  register,
  login,
};
