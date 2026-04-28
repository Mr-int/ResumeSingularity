import React from "react";
import { Link } from "react-router-dom";
import "./gradientButton.css";

const GradientButton = ({
    as = "button",
    to,
    type = "button",
    className = "",
    icon = null,
    children,
    ...props
}) => {
    const classes = `gradientButton ${className}`.trim();
    const content = (
        <>
            <span>{children}</span>
            {icon ? <span className="gradientButton__icon">{icon}</span> : null}
        </>
    );

    if (as === "link") {
        return (
            <Link to={to} className={classes} {...props}>
                {content}
            </Link>
        );
    }

    return (
        <button type={type} className={classes} {...props}>
            {content}
        </button>
    );
};

export default GradientButton;
