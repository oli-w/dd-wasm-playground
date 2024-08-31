import React from 'react';

export const ResetButton = () => {
    const onReset = () => {
        window.localStorage.clear();
        window.location.reload();
    };

    return <button onClick={onReset}>Clear and reset</button>;
};
