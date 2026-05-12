import {
    GET_USER_PERMISSIONS_SUCCESS,
    GET_USER_PERMISSIONS_FAILURE,
    GET_AVAILABLE_ROLES_SUCCESS,
    GET_AVAILABLE_ROLES_FAILURE,
    GET_NAMESPACES_SUCCESS,
    GET_NAMESPACES_FAILURE
} from '../../action/rbacAction/rbacActionTypes';

const initialState = {
    userPermissions: [],
    availableRoles: [],
    namespaces: [],
    error: null
};

const rbacReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_USER_PERMISSIONS_SUCCESS:
            return {
                ...state,
                userPermissions: action.payload,
                error: null
            };
        case GET_USER_PERMISSIONS_FAILURE:
            return {
                ...state,
                error: action.payload
            };
        case GET_AVAILABLE_ROLES_SUCCESS:
            return {
                ...state,
                availableRoles: action.payload,
                error: null
            };
        case GET_AVAILABLE_ROLES_FAILURE:
            return {
                ...state,
                error: action.payload
            };
        case GET_NAMESPACES_SUCCESS:
            return {
                ...state,
                namespaces: action.payload,
                error: null
            };
        case GET_NAMESPACES_FAILURE:
            return {
                ...state,
                error: action.payload
            };
        default:
            return state;
    }
};

export default rbacReducer;
