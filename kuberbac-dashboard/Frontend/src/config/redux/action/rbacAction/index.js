import axios from 'axios';
import {
    GET_USER_PERMISSIONS_SUCCESS,
    GET_USER_PERMISSIONS_FAILURE,
    GET_AVAILABLE_ROLES_SUCCESS,
    GET_AVAILABLE_ROLES_FAILURE,
    GET_NAMESPACES_SUCCESS,
    GET_NAMESPACES_FAILURE,
    CREATE_ROLE_BINDING_SUCCESS,
    CREATE_ROLE_BINDING_FAILURE,
    DELETE_ROLE_BINDING_SUCCESS,
    DELETE_ROLE_BINDING_FAILURE
} from './rbacActionTypes';

const API_URL = '/api';

export const getUserPermissions = (username) => {
    return async (dispatch) => {
        try {
            const response = await axios.get(`${API_URL}/rbac/user-permissions/${username}`, { withCredentials: true });
            dispatch({
                type: GET_USER_PERMISSIONS_SUCCESS,
                payload: response.data
            });
        } catch (error) {
            dispatch({
                type: GET_USER_PERMISSIONS_FAILURE,
                payload: error.message
            });
        }
    };
};

export const getAvailableRoles = (namespace) => {
    return async (dispatch) => {
        try {
            const response = await axios.get(`${API_URL}/rbac/roles/${namespace}`, { withCredentials: true });
            dispatch({
                type: GET_AVAILABLE_ROLES_SUCCESS,
                payload: response.data
            });
        } catch (error) {
            dispatch({
                type: GET_AVAILABLE_ROLES_FAILURE,
                payload: error.message
            });
        }
    };
};

export const getNamespaces = () => {
    return async (dispatch) => {
        try {
            const response = await axios.get(`${API_URL}/rbac/namespaces`, { withCredentials: true });
            dispatch({
                type: GET_NAMESPACES_SUCCESS,
                payload: response.data
            });
        } catch (error) {
            dispatch({
                type: GET_NAMESPACES_FAILURE,
                payload: error.message
            });
        }
    };
};

export const createRoleBinding = (namespace, data) => {
    return async (dispatch) => {
        try {
            const response = await axios.post(`${API_URL}/rbac/bindings/${namespace}`, data, { withCredentials: true });
            dispatch({
                type: CREATE_ROLE_BINDING_SUCCESS,
                payload: response.data
            });
            return response.data;
        } catch (error) {
            dispatch({
                type: CREATE_ROLE_BINDING_FAILURE,
                payload: error.message
            });
            throw error;
        }
    };
};

export const deleteRoleBinding = (namespace, name) => {
    return async (dispatch) => {
        try {
            const response = await axios.delete(`${API_URL}/rbac/bindings/${namespace}/${name}`, { withCredentials: true });
            dispatch({
                type: DELETE_ROLE_BINDING_SUCCESS,
                payload: response.data
            });
            return response.data;
        } catch (error) {
            dispatch({
                type: DELETE_ROLE_BINDING_FAILURE,
                payload: error.message
            });
            throw error;
        }
    };
};
