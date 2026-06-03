import React from 'react';

export function ProjectBodyText({ text }) {
    if (!text) return null;
    return text.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 ? (
                <>
                    <br />
                    <br />
                </>
            ) : null}
        </React.Fragment>
    ));
}
