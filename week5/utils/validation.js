const isUndefined = value => {
    return value === undefined;
};

const isNotValidString = value => {
    return (
        typeof value !== 'string' || value.trim().length === 0 || value === ''
    );
};

const isNotValidInteger = value => {
    return typeof value !== 'number' || value < 0 || value % 1 !== 0;
};

const isValidateUUID = uuid => {
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

module.exports = {
    isUndefined,
    isNotValidString,
    isNotValidInteger,
    isValidateUUID,
};
