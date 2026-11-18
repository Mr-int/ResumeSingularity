import { Link } from 'react-router-dom';
import arrowUp from '../../assets/employerLanding/arrow-up.svg';
import arrowDown from '../../assets/employerLanding/arrow-down.svg';

export function LandingButton({
  children,
  variant = 'primary',
  arrow,
  className = '',
  to,
  ...props
}) {
  const classes = `button button--${variant} ${className}`.trim();
  const content = (
    <>
      <span>{children}</span>
      {arrow ? (
        <img className="button__arrow" src={arrow === 'down' ? arrowDown : arrowUp} alt="" aria-hidden="true" />
      ) : null}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {content}
    </button>
  );
}

export function scrollToSection(sectionId, titleId) {
  document.getElementById(sectionId)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  document.getElementById(titleId)?.focus({ preventScroll: true });
}
