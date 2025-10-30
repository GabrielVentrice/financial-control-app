export const useMobileMenu = () => {
  // Shared state for mobile menu
  const isMobileMenuOpen = useState('mobileMenuOpen', () => false)
  
  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }
  
  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
  }
  
  const openMobileMenu = () => {
    isMobileMenuOpen.value = true
  }
  
  return {
    isMobileMenuOpen: readonly(isMobileMenuOpen),
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu
  }
}