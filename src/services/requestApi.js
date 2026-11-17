const disabled = () => {
    const err = new Error('Заявки временно недоступны');
    err.status = 0;
    return Promise.reject(err);
};

/** Заявки request/ на публичном фронте отключены. */
export const createRequest = () => disabled();

export const getRequestById = () => disabled();

export const filterRequests = () => disabled();

export const postStudentDecision = () => disabled();
